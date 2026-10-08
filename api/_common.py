"""Shared helpers: URL validation, yt-dlp options and format normalisation."""

import json
import logging
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
import urllib.request
from collections import defaultdict, deque
from urllib.parse import quote, urlparse

# id -> (display name, host domains, yt-dlp extractor-name regexes).
# Keep in sync with lib/platforms.ts.
PLATFORMS = {
    "tiktok": ("TikTok", ("tiktok.com",), (r"tiktok(:.*)?", r"vm\.tiktok")),
    "instagram": ("Instagram", ("instagram.com",), (r"instagram.*",)),
    "facebook": ("Facebook", ("facebook.com", "fb.watch", "fb.com"), (r"facebook.*",)),
    "x": ("X", ("x.com", "twitter.com", "t.co"), (r"twitter(:.*)?",)),
    "pinterest": (
        "Pinterest",
        ("pinterest.com", "pinterest.co.uk", "pinterest.ca", "pinterest.com.au", "pinterest.de",
         "pinterest.fr", "pinterest.es", "pinterest.it", "pinterest.jp", "pin.it"),
        (r"pinterest.*",),
    ),
    "snapchat": ("Snapchat", ("snapchat.com",), (r"snapchat.*",)),
    "dailymotion": ("Dailymotion", ("dailymotion.com", "dai.ly"), (r"dailymotion(:.*)?",)),
    "twitch": ("Twitch", ("twitch.tv",), (r"twitch:.*",)),
    "linkedin": ("LinkedIn", ("linkedin.com",), (r"linkedin(:.*)?",)),
    "reddit": ("Reddit", ("reddit.com", "redd.it"), (r"reddit",)),
    "soundcloud": ("SoundCloud", ("soundcloud.com",), (r"soundcloud.*",)),
    "bluesky": ("Bluesky", ("bsky.app",), (r"bluesky",)),
    "tumblr": ("Tumblr", ("tumblr.com",), (r"tumblr",)),
    "streamable": ("Streamable", ("streamable.com",), (r"streamable",)),
    "rumble": ("Rumble", ("rumble.com",), (r"rumble.*",)),
    "9gag": ("9GAG", ("9gag.com",), (r"9gag",)),
    "imgur": ("Imgur", ("imgur.com",), (r"imgur(:.*)?",)),
}

# Not offered: Vimeo (yt-dlp now needs a logged-in account) and Likee (its
# yt-dlp extractor is broken).

# Sites behind Cloudflare-style bot checks: yt-dlp imitates a real browser's
# TLS fingerprint (needs the curl-cffi extra) to get through.
IMPERSONATE = {"rumble"}

# Disabled for now: YouTube bot-blocks data-center IPs such as Vercel's. The
# YouTube helpers below are kept; re-enable by adding this back to PLATFORMS
# (and to lib/platforms.ts).
YOUTUBE = ("YouTube", ("youtube.com", "youtu.be"), (r"youtube.*",))

# Short-link hosts that yt-dlp only handles through its catch-all "generic"
# extractor, which we don't load. We follow their redirects ourselves.
SHORT_LINK_HOSTS = {"pin.it", "redd.it", "fb.watch"}

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

COOKIE_PATH = "/tmp/yt_cookies.txt"

log = logging.getLogger("uvicorn.error")


class UserError(Exception):
    """An error whose message is safe to show to the end user."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def platform_name(platform: str) -> str:
    return PLATFORMS.get(platform, YOUTUBE if platform == "youtube" else (platform,))[0]


def _host_matches(host: str, domains) -> bool:
    return any(host == d or host.endswith("." + d) for d in domains)


def detect_platform(url: str) -> str | None:
    host = (urlparse(url).hostname or "").lower()
    for platform, (_, domains, _) in PLATFORMS.items():
        if _host_matches(host, domains):
            return platform
    return None


def check_not_blocked(*urls: str | None):
    """Links removed after a copyright (DMCA) notice. BLOCKED_LINKS is a
    comma-separated list of video IDs or URL fragments, set in the environment."""
    blocked = [b.strip().lower() for b in os.environ.get("BLOCKED_LINKS", "").split(",") if b.strip()]
    for url in filter(None, urls):
        if any(b in url.lower() for b in blocked):
            raise UserError("This video has been removed following a copyright request.", 451)


def validate_url(url: str) -> str:
    """Return the platform id, or raise UserError. Blocks non-allowlisted hosts (SSRF)."""
    url = (url or "").strip()
    if len(url) > 2048 or urlparse(url).scheme not in ("http", "https"):
        raise UserError("Please paste a valid http(s) video link.")
    platform = detect_platform(url)
    if not platform:
        raise UserError("This site isn't supported yet. Pick one of the platforms above.")
    return platform


class _AllowlistRedirects(urllib.request.HTTPRedirectHandler):
    """Only follow redirects that stay on the platform's own domains."""

    def __init__(self, domains):
        self.domains = domains

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        host = (urlparse(newurl).hostname or "").lower()
        if urlparse(newurl).scheme not in ("http", "https") or not _host_matches(host, self.domains):
            raise UserError("This short link doesn't lead to a supported video.")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def resolve_short_link(url: str, platform: str) -> str:
    """Expand pin.it / redd.it / fb.watch links to the full page URL."""
    host = (urlparse(url).hostname or "").lower()
    if host not in SHORT_LINK_HOSTS:
        return url
    opener = urllib.request.build_opener(_AllowlistRedirects(PLATFORMS[platform][1]))
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with opener.open(req, timeout=10) as resp:
            final = resp.geturl()
    except UserError:
        raise
    except Exception as e:
        log.warning("short link %s failed: %s", url, e)
        raise UserError("Couldn't open this short link. Try the full link instead.", 422) from e
    if detect_platform(final) != platform:
        raise UserError("This short link doesn't lead to a supported video.")
    return final


def ydl_opts(platform: str) -> dict:
    extractors = PLATFORMS[platform][2] if platform in PLATFORMS else YOUTUBE[2]
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
        "socket_timeout": 15,
        "http_headers": {"User-Agent": USER_AGENT},
        # Only the platform's own extractors: no "generic" page scraping, so a
        # link can't be used to make the server fetch arbitrary sites.
        "allowed_extractors": list(extractors),
    }
    # Optional Netscape-format cookies (helps with YouTube bot checks / IG login walls).
    cookies = os.environ.get("YT_COOKIES")
    if cookies:
        if not os.path.exists(COOKIE_PATH):
            with open(COOKIE_PATH, "w") as f:
                f.write(cookies)
        opts["cookiefile"] = COOKIE_PATH
    proxy = os.environ.get("PROXY_URL")
    if proxy:
        opts["proxy"] = proxy
    if platform in IMPERSONATE:
        from yt_dlp.networking.impersonate import ImpersonateTarget

        opts["impersonate"] = ImpersonateTarget("chrome")
    # YouTube needs a JS runtime (Deno) to solve its player challenges.
    deno = deno_path()
    if deno:
        opts["js_runtimes"] = {"deno": {"path": deno}}
    return opts


def ffmpeg_path() -> str | None:
    """FFMPEG_PATH, else ffmpeg from the `imageio-ffmpeg` pip package, else PATH."""
    if os.environ.get("FFMPEG_PATH"):
        return os.environ["FFMPEG_PATH"]
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except (ImportError, RuntimeError):
        return shutil.which("ffmpeg")


def deno_path() -> str | None:
    """DENO_PATH, else the binary from the `deno` pip package (venv or Vercel's
    --target install), else None so yt-dlp falls back to `deno` on PATH."""
    if os.environ.get("DENO_PATH"):
        return os.environ["DENO_PATH"]
    try:
        from deno import find_deno_bin

        return find_deno_bin()
    except (ImportError, FileNotFoundError):
        return None


MAX_ITEMS = 20


def media_entries(info: dict) -> list[dict]:
    """The videos in a post. Posts with several videos (Instagram carousels,
    X, Reddit galleries...) come back as playlists; images are skipped."""
    if info.get("_type") != "playlist":
        return [info] if info.get("formats") else []
    return [e for e in info.get("entries") or [] if e and e.get("formats")][:MAX_ITEMS]


def extract(url: str, platform: str) -> tuple[dict, list[dict]]:
    """(the post's info, its videos)."""
    import yt_dlp

    try:
        with yt_dlp.YoutubeDL(ydl_opts(platform)) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as e:
        raise UserError(friendly_error(str(e)), 422) from e
    entries = media_entries(info)
    if not entries:
        raise UserError("No video found at this link.", 404)
    return info, entries


def friendly_error(msg: str) -> str:
    log.warning("extraction failed: %s", msg)
    m = msg.lower()
    if "private" in m:
        return "This video is private."
    if "sign in" in m or "login" in m or "log in" in m or "cookies" in m or "bot" in m:
        return "The platform requires login or blocked the request. Try again later."
    if "unsupported url" in m or "no suitable extractor" in m:
        return "This link doesn't point to a downloadable video."
    if "timed out" in m or "timeout" in m:
        return "The platform took too long to respond. Please try again."
    if "429" in m or "rate" in m:
        return "Too many requests to the platform. Please try again in a minute."
    if "needs to be reloaded" in m or "js runtime" in m or "challenge" in m:
        return "The platform changed something on its side. Please try again shortly."
    if "no video" in m:
        return "This post doesn't contain a video."
    if "not available" in m or "removed" in m or "404" in m:
        return "This video is unavailable or was removed."
    return "Couldn't fetch this video. Check the link and try again."


DIRECT_PROTOCOLS = ("http", "https")
HLS_PROTOCOLS = ("m3u8", "m3u8_native")


def _is_hls(f: dict) -> bool:
    return f.get("protocol") in HLS_PROTOCOLS


def _usable(f: dict) -> bool:
    # Plain files are streamed straight through; HLS playlists are remuxed by
    # ffmpeg. DASH manifests and other protocols aren't supported.
    return bool(f.get("url")) and f.get("protocol") in DIRECT_PROTOCOLS + HLS_PROTOCOLS


def find_format(info: dict, format_id: str) -> dict | None:
    return next((f for f in info.get("formats") or [] if f.get("format_id") == format_id), None)


def stream_format(ydl, f: dict, chunk_size: int = 256 * 1024):
    """Yield the format's bytes. Uses Range requests when the extractor asks for
    them (YouTube throttles single long requests to a crawl)."""
    from yt_dlp.networking import Request

    headers = f.get("http_headers") or {}
    step = (f.get("downloader_options") or {}).get("http_chunk_size")
    total = f.get("filesize")
    if not step or not total:
        with ydl.urlopen(Request(f["url"], headers=headers)) as resp:
            while chunk := resp.read(chunk_size):
                yield chunk
        return
    for start in range(0, total, step):
        end = min(start + step, total) - 1
        with ydl.urlopen(Request(f["url"], headers={**headers, "Range": f"bytes={start}-{end}"})) as resp:
            while chunk := resp.read(chunk_size):
                yield chunk


def stream_hls(ydl, f: dict):
    """Yield an HLS stream's media as one continuous TS/fMP4 byte stream.

    We fetch the segments ourselves (with yt-dlp's networking, so cookies,
    proxy and browser impersonation apply) instead of letting ffmpeg do it:
    the static ffmpeg build can't resolve DNS, and keeping ffmpeg off the
    network also means a playlist can't make it read anything else.
    """
    from urllib.parse import urljoin

    from yt_dlp.aes import aes_cbc_decrypt_bytes, unpad_pkcs7
    from yt_dlp.networking import Request
    from yt_dlp.utils import parse_m3u8_attributes

    headers = f.get("http_headers") or {}

    def get(url: str, byterange: tuple[int, int] | None = None) -> bytes:
        h = dict(headers)
        if byterange:
            h["Range"] = f"bytes={byterange[0]}-{byterange[0] + byterange[1] - 1}"
        with ydl.urlopen(Request(url, headers=h)) as resp:
            return resp.read()

    def parse_range(spec: str, next_offset: int) -> tuple[int, int]:
        length, _, offset = spec.partition("@")
        return (int(offset) if offset else next_offset, int(length))

    url = f["url"]
    text = get(url).decode("utf-8", "replace")
    if "#EXT-X-STREAM-INF" in text:  # master playlist: take the best variant
        variants, bandwidth = [], 0
        for line in text.splitlines():
            if line.startswith("#EXT-X-STREAM-INF:"):
                bandwidth = int(parse_m3u8_attributes(line.split(":", 1)[1]).get("BANDWIDTH") or 0)
            elif line and not line.startswith("#"):
                variants.append((bandwidth, urljoin(url, line)))
        url = max(variants)[1]
        text = get(url).decode("utf-8", "replace")

    key = iv = None
    seq = 0
    next_offset = 0
    seg_range = None
    for line in (l.strip() for l in text.splitlines()):
        if line.startswith("#EXT-X-MEDIA-SEQUENCE:"):
            seq = int(line.split(":", 1)[1])
        elif line.startswith("#EXT-X-KEY:"):
            attrs = parse_m3u8_attributes(line.split(":", 1)[1])
            method = attrs.get("METHOD")
            if method == "NONE":
                key = None
            elif method == "AES-128":
                key = get(urljoin(url, attrs["URI"]))
                iv = bytes.fromhex(attrs["IV"][2:].zfill(32)) if attrs.get("IV") else None
            else:
                raise UserError("This video uses DRM protection and can't be downloaded.", 422)
        elif line.startswith("#EXT-X-MAP:"):
            attrs = parse_m3u8_attributes(line.split(":", 1)[1])
            rng = parse_range(attrs["BYTERANGE"], 0) if attrs.get("BYTERANGE") else None
            yield get(urljoin(url, attrs["URI"]), rng)
        elif line.startswith("#EXT-X-BYTERANGE:"):
            seg_range = parse_range(line.split(":", 1)[1], next_offset)
        elif line and not line.startswith("#"):
            data = get(urljoin(url, line), seg_range)
            if seg_range:
                next_offset = seg_range[0] + seg_range[1]
                seg_range = None
            if key:
                data = unpad_pkcs7(aes_cbc_decrypt_bytes(data, key, iv or seq.to_bytes(16, "big")))
            yield data
            seq += 1


class FfmpegStream:
    """A file that ffmpeg remuxes on the fly (no re-encoding).

    Used to merge separate video and audio streams, and to turn HLS streams
    into a single file. Every input is downloaded by us and fed to ffmpeg
    through a named pipe by a background thread, so ffmpeg never touches the
    network. MP4 output is fragmented so it can be written to a pipe without
    seeking.

    Iterate it for the bytes, and always call close() (from any thread): it
    kills ffmpeg, which also unblocks a reader stuck in __iter__, and removes
    the temp files.
    """

    def __init__(
        self,
        ydls: list,
        sources: list[dict],
        out: str = "mp4",
        to_mp3: bool = False,
        chunk_size: int = 256 * 1024,
    ):
        self.chunk_size = chunk_size
        self._lock = threading.Lock()
        self._closed = False
        self.tmp = tempfile.mkdtemp(prefix="ffmpeg-")
        self.pipes: list[str] = []
        feeds = []

        cmd = [ffmpeg_path(), "-hide_banner", "-loglevel", "error"]
        for i, (ydl, f) in enumerate(zip(ydls, sources)):
            pipe = os.path.join(self.tmp, f"input{i}")
            os.mkfifo(pipe)
            self.pipes.append(pipe)
            feeds.append((ydl, f, pipe))
            cmd += ["-i", pipe]

        if to_mp3:
            # The only re-encode we do: audio to constant-bitrate MP3 (so the
            # size estimate is accurate).
            cmd += ["-map", "0:a:0", "-vn", "-c:a", "libmp3lame", "-b:a", f"{MP3_KBPS}k"]
        elif len(sources) == 2:
            cmd += ["-map", "0:v:0", "-map", "1:a:0", "-c", "copy"]
        else:
            cmd += ["-map", "0:v:0?", "-map", "0:a:0?", "-c", "copy"]
        # AAC from MPEG-TS (HLS) segments is ADTS-framed; MP4 needs it converted.
        if not to_mp3 and out != "mp3" and any(_is_hls(f) and (f.get("acodec") or "mp4a").startswith("mp4a") for f in sources):
            cmd += ["-bsf:a", "aac_adtstoasc"]
        if out == "mp3":
            cmd += ["-f", "mp3"]
        else:
            cmd += ["-movflags", "frag_keyframe+empty_moov+default_base_moof", "-f", "mp4"]
        cmd.append("pipe:1")

        self.errlog = open(os.path.join(self.tmp, "ffmpeg.log"), "w+")
        self.proc = subprocess.Popen(
            cmd,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=self.errlog,
            # The static ffmpeg build segfaults when its MPEG-TS reader tries to
            # load the system's iconv modules (for channel names); an empty
            # GCONV_PATH makes that lookup fail cleanly instead.
            env={**os.environ, "GCONV_PATH": "/nonexistent"},
        )
        self.threads = [threading.Thread(target=self._feed, args=feed, daemon=True) for feed in feeds]
        for t in self.threads:
            t.start()

    @staticmethod
    def _feed(ydl, fmt: dict, path: str):
        try:
            chunks = stream_hls(ydl, fmt) if _is_hls(fmt) else stream_format(ydl, fmt)
            with open(path, "wb") as fh:
                for chunk in chunks:
                    fh.write(chunk)
        except OSError:
            pass  # ffmpeg exited or the download was cancelled
        except Exception:
            log.exception("ffmpeg input failed")

    def __iter__(self):
        while chunk := self.proc.stdout.read(self.chunk_size):
            yield chunk
        if self.proc.wait() != 0 and not self._closed:
            self.errlog.seek(0)
            log.warning("ffmpeg failed: %s", self.errlog.read()[-2000:])

    def close(self):
        with self._lock:
            if self._closed:
                return
            self._closed = True
        if self.proc.poll() is None:
            self.proc.kill()
        self.proc.wait()
        # Unblock feeders still waiting to open their pipe, so their threads end.
        for p in self.pipes:
            try:
                os.close(os.open(p, os.O_RDONLY | os.O_NONBLOCK))
            except OSError:
                pass
        for t in self.threads:
            t.join(timeout=5)
        self.errlog.close()
        shutil.rmtree(self.tmp, ignore_errors=True)


def _size(f: dict, duration: float | None) -> int | None:
    size = f.get("filesize") or f.get("filesize_approx")
    # HLS formats rarely report a size; estimate it from bitrate x duration.
    if not size and f.get("tbr") and duration:
        size = int(f["tbr"] * 1000 / 8 * duration)
    return size


def _classify(f: dict) -> tuple[bool, bool]:
    """(has video, has audio). Many extractors leave codecs unset (None), so
    fall back to whether the format has a picture size or an audio bitrate."""
    vcodec, acodec = f.get("vcodec"), f.get("acodec")
    has_v = vcodec != "none" and (vcodec is not None or bool(f.get("height")))
    if acodec is not None:
        has_a = acodec != "none"
    elif vcodec == "none":
        has_a = True  # explicitly audio-only
    elif vcodec is None:
        # Codecs unknown: a sized file is a normal video with sound (TikTok,
        # FB); an unsized one with a bitrate is audio-only (SoundCloud).
        has_a = bool(f.get("height")) or bool(f.get("abr"))
    else:
        has_a = False
    return has_v, has_a


def best_audio(info: dict) -> dict | None:
    audios = [
        f for f in info.get("formats") or []
        if _usable(f) and _classify(f) == (False, True)
    ]
    return max(audios, key=_audio_rank, default=None)


def _audio_ext(f: dict) -> str:
    """The file type an audio format ends up as after download."""
    if not _is_hls(f):
        return f.get("ext") or "m4a"
    return "mp3" if (f.get("acodec") or f.get("ext") or "").startswith("mp3") else "m4a"


VIDEO_EXTS = ("mp4", "webm", "mov", "m4v", "mkv")
MP3_ID = "mp3"
MP3_KBPS = 192


def mp3_source(info: dict) -> dict | None:
    """What to convert to MP3: the best audio-only stream, else the smallest
    video that has sound (posts like Instagram Reels have no separate audio)."""
    audio = best_audio(info)
    if audio:
        return audio
    muxed = [
        f for f in info.get("formats") or []
        if _usable(f) and _classify(f) == (True, True)
    ]
    return min(muxed, key=lambda f: (_is_hls(f), f.get("tbr") or f.get("height") or 0), default=None)
UNSIZED_QUALITIES = ("Best", "High", "Medium", "Low")


def normalize_formats(info: dict) -> list[dict]:
    """Collapse yt-dlp's format list into one option per resolution plus audio-only.
    Video-only formats are paired with the best audio and merged at download time."""
    duration = info.get("duration")
    best_by_height: dict[int, dict] = {}
    unsized: list[dict] = []
    for f in info.get("formats") or []:
        if not _usable(f) or f.get("ext") == "gif":  # animated GIFs: the MP4 copy is better
            continue
        has_v, has_a = _classify(f)
        if not has_v:
            # Some sites (LinkedIn, Imgur) give plain video files with no codec
            # or size info at all; keep them in case there's nothing better.
            if f.get("vcodec") is None and f.get("acodec") is None and f.get("ext") in VIDEO_EXTS:
                unsized.append({**f, "_has_audio": True})
            continue
        # Use the short side so portrait 720x1280 (TikTok/Reels) reads as "720p".
        height = min(filter(None, (f.get("width"), f.get("height"))), default=0)
        if not height:
            unsized.append({**f, "_has_audio": has_a})
            continue
        cand = {**f, "_has_audio": has_a}
        cur = best_by_height.get(height)
        if cur is None or _video_rank(cand) > _video_rank(cur):
            best_by_height[height] = cand

    # (quality label, height, format): by resolution, or by bitrate when no
    # format reports a resolution.
    videos = [(f"{h}p", h, best_by_height[h]) for h in sorted(best_by_height, reverse=True)]
    if not videos:
        unsized.sort(key=lambda f: f.get("tbr") or 0, reverse=True)
        videos = [(q, None, f) for q, f in zip(UNSIZED_QUALITIES, unsized)]

    audio = best_audio(info)
    has_ffmpeg = ffmpeg_path() is not None
    out = []
    for quality, height, f in videos:
        # Video without sound is merged with the best audio; if the post has no
        # audio at all (GIF-style clips on Imgur, X), it's delivered silent.
        needs_merge = not f["_has_audio"] and audio is not None
        needs_ffmpeg = needs_merge or _is_hls(f)
        size = _size(f, duration)
        if needs_merge and size and _size(audio, duration):
            size += _size(audio, duration)
        ext = "mp4" if needs_ffmpeg else (f.get("ext") or "mp4")
        out.append({
            "format_id": f["format_id"],
            "label": f"{quality} {ext.upper()}",
            "quality": quality,
            "kind": "video",
            "height": height,
            "fps": f.get("fps"),
            "ext": ext,
            "filesize": size,
            "needs_merge": needs_merge,
            "needs_ffmpeg": needs_ffmpeg,
            "available": has_ffmpeg or not needs_ffmpeg,
        })
    # MP3 conversion, unless the platform's own audio already is MP3.
    if has_ffmpeg and mp3_source(info) and not (audio and _audio_ext(audio) == "mp3"):
        out.append({
            "format_id": MP3_ID,
            "label": "MP3 audio",
            "quality": "MP3",
            "kind": "audio",
            "height": None,
            "fps": None,
            "ext": "mp3",
            "filesize": int(MP3_KBPS * 1000 / 8 * duration) if duration else None,
            "needs_merge": False,
            "needs_ffmpeg": True,
            "available": True,
        })
    if audio:
        ext = _audio_ext(audio)
        out.append({
            "format_id": audio["format_id"],
            "label": f"Audio only {ext.upper()}",
            "quality": ext.upper(),
            "kind": "audio",
            "height": None,
            "fps": None,
            "ext": ext,
            "filesize": _size(audio, duration),
            "needs_merge": False,
            "needs_ffmpeg": _is_hls(audio),
            "available": has_ffmpeg or not _is_hls(audio),
        })
    return out


def _video_rank(f: dict) -> tuple:
    # Prefer files with audio, then plain files over HLS (faster), then mp4,
    # then H.264 (plays everywhere), then bitrate.
    vcodec = f.get("vcodec") or ""
    return (f["_has_audio"], not _is_hls(f), f.get("ext") == "mp4", vcodec.startswith("avc1"), f.get("tbr") or 0)


def _audio_rank(f: dict) -> tuple:
    # Prefer m4a (plays in MP4), plain files over HLS, then the original mix
    # over YouTube's "-drc" dynamic-range-compressed copy, then bitrate.
    drc = "drc" in str(f.get("format_id"))
    return (f.get("ext") == "m4a", not _is_hls(f), not drc, f.get("abr") or f.get("tbr") or 0)


MEDIA_TYPES = {"mp4": "video/mp4", "m4a": "audio/mp4", "mp3": "audio/mpeg", "webm": "video/webm"}


def media_type(choice: dict) -> str:
    if choice["kind"] == "audio" and choice["ext"] == "webm":
        return "audio/webm"
    return MEDIA_TYPES.get(choice["ext"], "application/octet-stream")


YOUTUBE_ID_RE = re.compile(r"(?:youtu\.be/|/shorts/|/live/|/embed/|[?&]v=)([\w-]{11})")


def youtube_id(url: str) -> str | None:
    m = YOUTUBE_ID_RE.search(url)
    return m.group(1) if m else None


def is_youtube_short(url: str, info: dict) -> bool:
    if "/shorts/" in url or "/shorts/" in (info.get("webpage_url") or ""):
        return True
    w, h = info.get("width"), info.get("height")
    return bool(w and h and h > w and (info.get("duration") or 0) <= 180)


def youtube_preview(url: str) -> dict | None:
    """Title, channel and thumbnail from YouTube's official oEmbed endpoint.

    oEmbed isn't behind YouTube's bot check, so this still works when yt-dlp is
    blocked on a data-center IP (e.g. Vercel). It has no media files, so the
    result can be previewed and watched but not downloaded.
    """
    vid = youtube_id(url)
    if not vid:
        return None
    # Asking with the /shorts/ form makes oEmbed report the vertical player size.
    canonical = f"https://www.youtube.com/{'shorts/' if '/shorts/' in url else 'watch?v='}{vid}"
    endpoint = "https://www.youtube.com/oembed?format=json&url=" + quote(canonical, safe="")
    try:
        req = urllib.request.Request(endpoint, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.load(resp)
    except Exception as e:  # private/removed videos return 401/404
        log.warning("oEmbed fallback failed: %s", e)
        return None
    return {
        "id": vid,
        "title": data.get("title"),
        "uploader": data.get("author_name"),
        "thumbnail": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
        "width": data.get("width"),
        "height": data.get("height"),
    }


def embed_url(platform: str, info: dict) -> str | None:
    """The platform's official embeddable player, where one works reliably.
    Other platforms are previewed by streaming the smallest format instead."""
    vid = info.get("id")
    if platform == "youtube" and vid:
        return f"https://www.youtube-nocookie.com/embed/{quote(vid)}?autoplay=1&rel=0"
    if platform == "tiktok" and vid:
        return f"https://www.tiktok.com/player/v1/{quote(vid)}?autoplay=1&rel=0"
    return None


def safe_filename(title: str, ext: str) -> str:
    name = re.sub(r"[^\w\-. ]+", "", title or "video").strip()[:80] or "video"
    return f"{name}.{ext}"


# Best-effort per-instance rate limiter (serverless instances don't share memory).
_hits: dict[str, deque] = defaultdict(deque)


def rate_limited(ip: str, limit: int = 20, window: int = 60) -> bool:
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        return True
    q.append(now)
    return False
