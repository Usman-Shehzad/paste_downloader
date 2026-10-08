import type { IconType } from "react-icons";
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";

export type PlatformId = "youtube" | "tiktok" | "instagram" | "facebook";

export interface Platform {
  id: PlatformId;
  name: string;
  icon: IconType;
  color: string;
  domains: string[];
  example: string;
  content: string[];
}

// Keep domains in sync with ALLOWED_HOSTS in api/_common.py.
export const PLATFORMS: Platform[] = [
  {
    id: "youtube",
    name: "YouTube",
    icon: FaYoutube,
    color: "#FF0033",
    domains: ["youtube.com", "youtu.be"],
    example: "https://www.youtube.com/watch?v=... or https://youtube.com/shorts/...",
    content: ["Videos", "Shorts", "Music audio"],
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: FaTiktok,
    color: "#25F4EE",
    domains: ["tiktok.com"],
    example: "https://www.tiktok.com/@user/video/...",
    content: ["Videos", "Original sound", "HD quality"],
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: FaInstagram,
    color: "#E1306C",
    domains: ["instagram.com"],
    example: "https://www.instagram.com/reel/...",
    content: ["Reels", "Video posts", "IGTV"],
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: FaFacebook,
    color: "#1877F2",
    domains: ["facebook.com", "fb.watch", "fb.com"],
    example: "https://www.facebook.com/watch?v=...",
    content: ["Videos", "Reels", "Watch"],
  },
];

export function getPlatform(id: PlatformId): Platform {
  return PLATFORMS.find((p) => p.id === id)!;
}
