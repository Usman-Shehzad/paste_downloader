import type { PlatformId } from "./platforms";

export interface VideoFormat {
  format_id: string;
  label: string;
  /** Short quality name: "1080p", "Best"/"High" when no resolution is known, or the audio type. */
  quality: string;
  kind: "video" | "audio";
  height: number | null;
  fps: number | null;
  ext: string;
  filesize: number | null;
  needs_merge: boolean;
  /** Remuxed by ffmpeg while downloading (merged or HLS), so the size is an estimate. */
  needs_ffmpeg: boolean;
  available: boolean;
}

/** One video of a post; posts with several videos (carousels, threads) have many. */
export interface VideoItem {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  embed_url: string | null;
  formats: VideoFormat[];
  /** What to pass as `item` when downloading this video. */
  source_index: number;
}

export interface VideoInfo {
  platform: PlatformId;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  uploader: string | null;
  width: number | null;
  height: number | null;
  embed_url: string | null;
  is_short: boolean;
  // Set when the video can be previewed but not downloaded (e.g. a platform blocking the server).
  notice: string | null;
  formats: VideoFormat[];
  /** Every video in the post; the top-level fields describe the first one. */
  items?: VideoItem[];
  /** Set by the result card to the selected video's `source_index`. */
  item?: number;
}

export async function fetchInfo(
  url: string,
  platform: PlatformId,
  signal?: AbortSignal,
): Promise<VideoInfo> {
  const res = await fetch("/api/py/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, platform }),
    signal,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Something went wrong. Please try again.");
  return data as VideoInfo;
}

/**
 * `item` picks a video in a multi-video post; `inline` streams the file for
 * playing in the page instead of saving it.
 */
export function downloadUrl(url: string, formatId: string, { item = 0, inline = false } = {}): string {
  const params = new URLSearchParams({ url, format_id: formatId });
  if (item) params.set("item", String(item));
  if (inline) params.set("inline", "1");
  return `/api/py/download?${params}`;
}

/**
 * The format to play for "Watch" when there's no official embed: the smallest
 * video (cheapest to stream), else the audio. Formats arrive best-first.
 */
export function previewFormat(info: VideoInfo): VideoFormat | null {
  const usable = info.formats.filter((f) => f.available);
  const videos = usable.filter((f) => f.kind === "video");
  return videos[videos.length - 1] ?? usable.find((f) => f.kind === "audio") ?? null;
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
