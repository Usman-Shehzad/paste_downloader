# Paste Cap
This platform help you to download the social media vedios from anywhere download by just one click to paste url to direct download

Paste a YouTube, TikTok, Instagram or Facebook link, pick the platform and quality, and download.

## Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS 4, react-icons
- **Backend:** FastAPI + [yt-dlp](https://github.com/yt-dlp/yt-dlp) in `api/index.py`, deployed as a Vercel Python function under `/api/py/*`

## Local development
```bash
pnpm install
curl -fsSL https://deno.land/install.sh | sh   # YouTube needs Deno
pip install -r requirements.txt
pnpm dev              # Next.js on :3000, FastAPI on :8000 (proxied via next.config.ts)
```

## API
- `POST /api/py/info` `{ "url": "..." }` returns the title, thumbnail, duration and a list of formats
- `GET /api/py/download?url=...&format_id=...` streams the file as an attachment

## Environment variables (optional)
| Name | Purpose |
|---|---|
| `YT_COOKIES` | Netscape-format cookies.txt contents, for login walls and bot checks |
| `DENO_PATH` | Path to the `deno` binary if it isn't on `PATH` |
| `PROXY_URL` | Outbound proxy for yt-dlp (e.g. a residential proxy if a platform blocks Vercel IPs) |

## Known limitations
- Formats that ship video and audio separately (all YouTube video qualities) need ffmpeg to merge, which Vercel doesn't provide. They show as "Coming soon".
- YouTube extraction requires the [Deno](https://deno.com) JS runtime (yt-dlp EJS). Without it, formats are missing and downloads are heavily throttled.
