import { PLATFORMS, type PlatformId } from "./platforms";

export function detectPlatform(input: string): PlatformId | null {
  let host: string;
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    host = url.hostname.toLowerCase();
  } catch {
    return null;
  }
  const match = PLATFORMS.find((p) =>
    p.domains.some((d) => host === d || host.endsWith(`.${d}`)),
  );
  return match?.id ?? null;
}
