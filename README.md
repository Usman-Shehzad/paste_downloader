# Paste Cap
This platform help you to download the social media vedios from anywhere download by just one click to paste url to direct download

Paste a video link, pick the platform and quality, and download.

**Supported:** TikTok, Instagram, Facebook, X (Twitter), Pinterest, Snapchat, Reddit, LinkedIn, Twitch, Dailymotion, SoundCloud, Bluesky, Tumblr, Rumble, Streamable, 9GAG, Imgur.

**Not offered right now:** YouTube (bot-blocks Vercel's servers; the code is kept and can be re-enabled in `api/_common.py` and `lib/platforms.ts`), Vimeo (yt-dlp needs a logged-in account), Likee (yt-dlp extractor broken).

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

## How downloads work
- Plain video files are streamed straight through to the browser.
- Separate video + audio streams and HLS (segmented) streams are fetched by the backend and remuxed by ffmpeg on the fly into one MP4 (no re-encoding). ffmpeg never touches the network itself.
- Short links (`pin.it`, `redd.it`, `fb.watch`) are expanded first, following only redirects that stay on the platform's own domains.
- yt-dlp only loads the selected platform's extractors, so a link can't make the server fetch arbitrary sites.

## Known limitations
- Some platforms block cloud servers or need login for some posts (private, age-restricted or friends-only content isn't supported).
- Sizes marked `~` are estimates (merged streams or bitrate × duration).
