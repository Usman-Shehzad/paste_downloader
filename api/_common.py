"""Shared helpers: URL validation, yt-dlp options and format normalisation."""

import logging
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
from collections import defaultdict, deque
from urllib.parse import quote, urlparse

ALLOWED_HOSTS = {
    "youtube": ("youtube.com", "youtu.be"),
    "tiktok": ("tiktok.com",),
    "instagram": ("instagram.com",),
    "facebook": ("facebook.com", "fb.watch", "fb.com"),
}

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


def detect_platform(url: str) -> str | None:
    host = (urlparse(url).hostname or "").lower()
    for platform, domains in ALLOWED_HOSTS.items():
        if any(host == d or host.endswith("." + d) for d in domains):
            return platform
    return None


def validate_url(url: str) -> str:
    """Return the platform id, or raise UserError. Blocks non-allowlisted hosts (SSRF)."""
    url = (url or "").strip()
    if len(url) > 2048 or urlparse(url).scheme not in ("http", "https"):
        raise UserError("Please paste a valid http(s) video link.")
    platform = detect_platform(url)
    if not platform:
        raise UserError("Only YouTube, TikTok, Instagram and Facebook links are supported.")
    return platform


def ydl_opts() -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
        "socket_timeout": 15,
        "http_headers": {"User-Agent": USER_AGENT},
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


def extract(url: str) -> dict:
    import yt_dlp

    try:
        with yt_dlp.YoutubeDL(ydl_opts()) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as e:
        raise UserError(friendly_error(str(e)), 422) from e
    if info.get("_type") == "playlist":
        entries = [e for e in info.get("entries") or [] if e]
        if not entries:
            raise UserError("No video found at this link.", 404)
        info = entries[0]
    return info


def friendly_error(msg: str) -> str:
    log.warning("extraction failed: %s", msg)
    m = msg.lower()
    if "private" in m:
        return "This video is private."
    if "sign in" in m or "login" in m or "cookies" in m or "bot" in m:
        return "The platform requires login or blocked the request. Try again later."
    if "unsupported url" in m:
        return "This link doesn't point to a downloadable video."
    if "429" in m or "rate" in m:
        return "Too many requests to the platform. Please try again in a minute."
    if "needs to be reloaded" in m or "js runtime" in m or "challenge" in m:
        return "The platform changed something on its side. Please try again shortly."
    if "not available" in m or "removed" in m or "404" in m:
        return "This video is unavailable or was removed."
    return "Couldn't fetch this video. Check the link and try again."


def _is_direct(f: dict) -> bool:
    # Only plain HTTP files can be streamed straight through (no HLS/DASH manifests).
    return f.get("protocol") in ("http", "https") and bool(f.get("url"))


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


class MergeStream:
    """An MP4 that ffmpeg muxes on the fly from separate video and audio streams.

    Both inputs are fed through named pipes by background threads; the output is
    fragmented MP4 so it can be written to a pipe without seeking. Iterate it for
    the bytes, and always call close() (from any thread): it kills ffmpeg, which
    also unblocks a reader stuck in __iter__, and removes the temp files.
    """

    def __init__(self, video_ydl, audio_ydl, video: dict, audio: dict, chunk_size: int = 256 * 1024):
        self.chunk_size = chunk_size
        self._lock = threading.Lock()
        self._closed = False
        self.tmp = tempfile.mkdtemp(prefix="merge-")
        self.pipes = [os.path.join(self.tmp, "video"), os.path.join(self.tmp, "audio")]
        for p in self.pipes:
            os.mkfifo(p)
        self.errlog = open(os.path.join(self.tmp, "ffmpeg.log"), "w+")
        self.proc = subprocess.Popen(
            [
                ffmpeg_path(), "-hide_banner", "-loglevel", "error",
                "-i", self.pipes[0], "-i", self.pipes[1],
                "-map", "0:v:0", "-map", "1:a:0", "-c", "copy",
                "-movflags", "frag_keyframe+empty_moov+default_base_moof",
                "-f", "mp4", "pipe:1",
            ],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=self.errlog,
        )
        self.threads = [
            threading.Thread(target=self._feed, args=(video_ydl, video, self.pipes[0]), daemon=True),
            threading.Thread(target=self._feed, args=(audio_ydl, audio, self.pipes[1]), daemon=True),
        ]
        for t in self.threads:
            t.start()

    @staticmethod
    def _feed(ydl, fmt: dict, path: str):
        try:
            with open(path, "wb") as fh:
                for chunk in stream_format(ydl, fmt):
                    fh.write(chunk)
        except OSError:
            pass  # ffmpeg exited or the download was cancelled
        except Exception:
            log.exception("merge input failed")

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


def _size(f: dict) -> int | None:
    return f.get("filesize") or f.get("filesize_approx")


def _classify(f: dict) -> tuple[bool, bool]:
    has_v = f.get("vcodec") not in (None, "none")
    has_a = f.get("acodec") not in (None, "none")
    # Some extractors (TikTok, FB) don't report codecs for muxed files.
    if f.get("vcodec") is None and f.get("acodec") is None and f.get("height"):
        has_v = has_a = True
    return has_v, has_a


def best_audio(info: dict) -> dict | None:
    audios = [
        f for f in info.get("formats") or []
        if _is_direct(f) and _classify(f) == (False, True)
    ]
    return max(audios, key=_audio_rank, default=None)


def normalize_formats(info: dict) -> list[dict]:
    """Collapse yt-dlp's format list into one option per resolution plus audio-only.
    Video-only formats are paired with the best audio and merged at download time."""
    best_by_height: dict[int, dict] = {}
    for f in info.get("formats") or []:
        if not _is_direct(f):
            continue
        has_v, has_a = _classify(f)
        if not has_v:
            continue
        # Use the short side so portrait 720x1280 (TikTok/Reels) reads as "720p".
        height = min(filter(None, (f.get("width"), f.get("height"))), default=0)
        if not height:
            continue
        cand = {**f, "_has_audio": has_a}
        cur = best_by_height.get(height)
        if cur is None or _video_rank(cand) > _video_rank(cur):
            best_by_height[height] = cand

    audio = best_audio(info)
    can_merge = audio is not None and ffmpeg_path() is not None
    out = []
    for height in sorted(best_by_height, reverse=True):
        f = best_by_height[height]
        needs_merge = not f["_has_audio"]
        size = _size(f)
        if needs_merge and size and audio and _size(audio):
            size += _size(audio)
        ext = "mp4" if needs_merge else (f.get("ext") or "mp4")
        out.append({
            "format_id": f["format_id"],
            "label": f"{height}p {ext.upper()}",
            "kind": "video",
            "height": height,
            "fps": f.get("fps"),
            "ext": ext,
            "filesize": size,
            "needs_merge": needs_merge,
            "available": can_merge or not needs_merge,
        })
    if audio:
        ext = audio.get("ext") or "m4a"
        out.append({
            "format_id": audio["format_id"],
            "label": f"Audio only {ext.upper()}",
            "kind": "audio",
            "height": None,
            "fps": None,
            "ext": ext,
            "filesize": _size(audio),
            "needs_merge": False,
            "available": True,
        })
    return out


def _video_rank(f: dict) -> tuple:
    # Prefer files with audio, then mp4, then H.264 (plays everywhere), then bitrate.
    vcodec = f.get("vcodec") or ""
    return (f["_has_audio"], f.get("ext") == "mp4", vcodec.startswith("avc1"), f.get("tbr") or 0)


def _audio_rank(f: dict) -> tuple:
    # Prefer m4a (plays in MP4), then the original mix over YouTube's "-drc"
    # dynamic-range-compressed copy, then bitrate.
    drc = "drc" in str(f.get("format_id"))
    return (f.get("ext") == "m4a", not drc, f.get("abr") or f.get("tbr") or 0)


def embed_url(platform: str, info: dict) -> str | None:
    """The platform's official embeddable player for watching before downloading."""
    vid = info.get("id")
    page = info.get("webpage_url") or ""
    if platform == "youtube" and vid:
        return f"https://www.youtube-nocookie.com/embed/{quote(vid)}?autoplay=1&rel=0"
    if platform == "tiktok" and vid:
        return f"https://www.tiktok.com/player/v1/{quote(vid)}?autoplay=1&rel=0"
    if platform == "instagram":
        m = re.search(r"instagram\.com/(?:[\w.]+/)?(p|reel|reels|tv)/([\w-]+)", page)
        if m:
            kind = "reel" if m.group(1) == "reels" else m.group(1)
            return f"https://www.instagram.com/{kind}/{m.group(2)}/embed/"
    if platform == "facebook" and page:
        return f"https://www.facebook.com/plugins/video.php?href={quote(page, safe='')}&show_text=false&autoplay=true"
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
