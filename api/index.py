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
    UserError,
    best_audio,
    embed_url,
    extract,
    find_format,
    friendly_error,
    MergeStream,
    normalize_formats,
    rate_limited,
    safe_filename,
    stream_format,
    validate_url,
    ydl_opts,
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


PLATFORM_NAMES = {"youtube": "YouTube", "tiktok": "TikTok", "instagram": "Instagram", "facebook": "Facebook"}


class InfoRequest(BaseModel):
    url: str
    # The tab the user picked; the link must belong to it.
    platform: str | None = None


@app.post("/api/py/info")
def info(body: InfoRequest, request: Request):
    _check_rate(request)
    platform = validate_url(body.url)
    if body.platform and body.platform != platform:
        raise UserError(
            f"This is a {PLATFORM_NAMES[platform]} link. Switch to the {PLATFORM_NAMES[platform]} tab "
            f"or paste a {PLATFORM_NAMES.get(body.platform, body.platform)} link."
        )
    data = extract(body.url)
    formats = normalize_formats(data)
    if not formats:
        raise UserError("No downloadable formats found for this video.", 404)
    return {
        "platform": platform,
        "title": data.get("title") or "Video",
        "thumbnail": data.get("thumbnail"),
        "duration": data.get("duration"),
        "uploader": data.get("uploader") or data.get("channel"),
        "width": data.get("width"),
        "height": data.get("height"),
        "embed_url": embed_url(platform, data),
        "formats": formats,
    }


@app.get("/api/py/download")
def download(request: Request, url: str = Query(...), format_id: str = Query(...)):
    _check_rate(request)
    validate_url(url)

    # Re-extract in this same invocation: YouTube media URLs are bound to the
    # extracting IP and expire, so they can't be reused from /info.
    ydl = yt_dlp.YoutubeDL(ydl_opts())
    try:
        data = ydl.extract_info(url, download=False)
        if data.get("_type") == "playlist":
            data = next((e for e in data.get("entries") or [] if e), {})
        allowed = {f["format_id"]: f for f in normalize_formats(data) if f["available"]}
        fmt = find_format(data, format_id)
        if format_id not in allowed or fmt is None:
            raise UserError("That quality isn't available for download.", 400)
    except yt_dlp.utils.DownloadError as e:
        ydl.close()
        raise UserError(friendly_error(str(e)), 422) from e
    except UserError:
        ydl.close()
        raise

    choice = allowed[format_id]
    merge = None
    if choice["needs_merge"]:
        # A second YoutubeDL so the audio feeder thread doesn't share a session.
        audio_ydl = yt_dlp.YoutubeDL(ydl_opts())
        merge = MergeStream(ydl, audio_ydl, fmt, best_audio(data))
        stream, closers = iter(merge), (ydl, audio_ydl)
    else:
        stream, closers = stream_format(ydl, fmt), (ydl,)

    # Async wrapper so a client disconnect (task cancellation) reliably runs the
    # cleanup; Starlette doesn't close sync iterators when the client goes away.
    async def body():
        try:
            async for chunk in iterate_in_threadpool(stream):
                yield chunk
        finally:
            if merge:
                with anyio.CancelScope(shield=True):
                    await run_in_threadpool(merge.close)
            for c in closers:
                c.close()

    filename = safe_filename(data.get("title"), choice["ext"])
    headers = {"Content-Disposition": f'attachment; filename="{filename}"', "Cache-Control": "no-store"}
    # Merged output size isn't known up front; direct files have an exact size.
    if not choice["needs_merge"] and fmt.get("filesize"):
        headers["Content-Length"] = str(fmt["filesize"])
    media = "audio/mp4" if choice["kind"] == "audio" else "video/mp4"
    if choice["ext"] not in ("mp4", "m4a"):
        media = "application/octet-stream"
    return StreamingResponse(body(), media_type=media, headers=headers)
