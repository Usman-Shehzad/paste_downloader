"""FastAPI app deployed as a single Vercel Python function (routes under /api/py)."""

import os
import sys

import anyio
from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.concurrency import iterate_in_threadpool, run_in_threadpool
from pydantic import BaseModel
import yt_dlp

sys.path.insert(0, os.path.dirname(__file__))

from _common import (  # noqa: E402
    FfmpegStream,
    UserError,
    best_audio,
    check_not_blocked,
    embed_url,
    extract,
    find_format,
    MP3_ID,
    friendly_error,
    is_youtube_short,
    media_entries,
    media_type,
    mp3_source,
    normalize_formats,
    platform_name,
    rate_limited,
    resolve_short_link,
    safe_filename,
    stream_format,
    validate_url,
    ydl_opts,
    youtube_preview,
)

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")


@app.exception_handler(UserError)
async def user_error_handler(_: Request, exc: UserError):
    return JSONResponse({"error": str(exc)}, status_code=exc.status)


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() or (request.client.host if request.client else "unknown")


def _check_rate(request: Request):
    if rate_limited(_client_ip(request)):
        raise UserError("Too many requests. Please wait a minute.", 429)


class InfoRequest(BaseModel):
    url: str
    # The tab the user picked; the link must belong to it.
    platform: str | None = None


@app.post("/api/py/info")
def info(body: InfoRequest, request: Request):
    _check_rate(request)
    platform = validate_url(body.url)
    if body.platform and body.platform != platform:
        name = platform_name(platform)
        raise UserError(
            f"This is a {name} link. Switch to the {name} tab "
            f"or paste a {platform_name(body.platform)} link."
        )
    url = resolve_short_link(body.url.strip(), platform)
    check_not_blocked(body.url, url)
    try:
        post, entries = extract(url, platform)
    except UserError as e:
        # YouTube often bot-blocks data-center IPs. Fall back to the official
        # oEmbed preview so the video can still be seen and watched.
        if platform == "youtube" and e.status == 422 and (preview := youtube_preview(url)):
            short = is_youtube_short(url, preview)
            return {
                "platform": platform,
                "is_short": short,
                "title": preview["title"] or "Video",
                "thumbnail": preview["thumbnail"],
                "duration": None,
                "uploader": preview["uploader"],
                "width": preview["width"],
                "height": preview["height"],
                "embed_url": embed_url(platform, preview),
                "formats": [],
                "notice": (
                    f"YouTube {'Shorts' if short else 'video'} downloads are temporarily unavailable "
                    "because YouTube is limiting our server. You can still watch it here, "
                    "or try again later."
                ),
            }
        raise
    items = []
    for source_index, entry in enumerate(entries):
        formats = normalize_formats(entry)
        if formats:
            items.append({
                "title": entry.get("title") or entry.get("description") or post.get("title") or "Video",
                "thumbnail": entry.get("thumbnail") or post.get("thumbnail"),
                "duration": entry.get("duration"),
                "width": entry.get("width"),
                "height": entry.get("height"),
                "embed_url": embed_url(platform, entry),
                "formats": formats,
                "index": len(items),
                "source_index": source_index,
            })
    check_not_blocked(post.get("webpage_url"), *(e.get("webpage_url") for e in entries))
    if not items:
        raise UserError("No downloadable video found in this post.", 404)
    first = items[0]
    return {
        "platform": platform,
        "is_short": platform == "youtube" and is_youtube_short(url, entries[0]),
        "notice": None,
        "uploader": post.get("uploader") or post.get("channel") or post.get("creator")
        or entries[0].get("uploader"),
        # The first video's details at the top level; every video in `items`.
        **{k: first[k] for k in ("title", "thumbnail", "duration", "width", "height", "embed_url", "formats")},
        "items": items,
    }


@app.get("/api/py/download")
def download(
    request: Request,
    url: str = Query(...),
    format_id: str = Query(...),
    item: int = Query(0, ge=0),  # which video of a multi-video post (`source_index`)
    inline: bool = Query(False),  # true: play in the page (preview) instead of saving
):
    _check_rate(request)
    platform = validate_url(url)
    url = resolve_short_link(url.strip(), platform)
    check_not_blocked(url)

    # Re-extract in this same invocation: media URLs are often bound to the
    # extracting IP and expire, so they can't be reused from /info.
    ydl = yt_dlp.YoutubeDL(ydl_opts(platform))
    try:
        entries = media_entries(ydl.extract_info(url, download=False))
        if item >= len(entries):
            raise UserError("That video isn't in this post anymore.", 404)
        data = entries[item]
        check_not_blocked(data.get("webpage_url"))
        allowed = {f["format_id"]: f for f in normalize_formats(data) if f["available"]}
        fmt = mp3_source(data) if format_id == MP3_ID else find_format(data, format_id)
        if format_id not in allowed or fmt is None:
            raise UserError("That quality isn't available for download.", 400)
    except yt_dlp.utils.DownloadError as e:
        ydl.close()
        raise UserError(friendly_error(str(e)), 422) from e
    except UserError:
        ydl.close()
        raise

    choice = allowed[format_id]
    ffmpeg = None
    if choice["needs_ffmpeg"]:
        sources = [fmt] + ([best_audio(data)] if choice["needs_merge"] else [])
        # One YoutubeDL per input so feeder threads don't share a session.
        ydls = [ydl] + [yt_dlp.YoutubeDL(ydl_opts(platform)) for _ in sources[1:]]
        ffmpeg = FfmpegStream(
            ydls, sources, out="mp3" if choice["ext"] == "mp3" else "mp4", to_mp3=format_id == MP3_ID
        )
        stream, closers = iter(ffmpeg), ydls
    else:
        stream, closers = stream_format(ydl, fmt), [ydl]

    # Async wrapper so a client disconnect (task cancellation) reliably runs the
    # cleanup; Starlette doesn't close sync iterators when the client goes away.
    async def body():
        try:
            async for chunk in iterate_in_threadpool(stream):
                yield chunk
        finally:
            if ffmpeg:
                with anyio.CancelScope(shield=True):
                    await run_in_threadpool(ffmpeg.close)
            for c in closers:
                c.close()

    filename = safe_filename(data.get("title"), choice["ext"])
    disposition = "inline" if inline else "attachment"
    headers = {"Content-Disposition": f'{disposition}; filename="{filename}"', "Cache-Control": "no-store"}
    # Remuxed output size isn't known up front; plain files have an exact size.
    if not choice["needs_ffmpeg"] and fmt.get("filesize"):
        headers["Content-Length"] = str(fmt["filesize"])
    return StreamingResponse(body(), media_type=media_type(choice), headers=headers)
