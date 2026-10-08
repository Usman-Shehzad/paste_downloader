import type { PlatformId } from "./platforms";

export interface VideoFormat {
  format_id: string;
  label: string;
  kind: "video" | "audio";
  height: number | null;
  fps: number | null;
  ext: string;
  filesize: number | null;
  needs_merge: boolean;
  available: boolean;
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
  formats: VideoFormat[];
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

export function downloadUrl(url: string, formatId: string): string {
  const params = new URLSearchParams({ url, format_id: formatId });
  return `/api/py/download?${params}`;
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
