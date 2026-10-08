import type { IconType } from "react-icons";
import {
  FaBluesky,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaReddit,
  FaSnapchat,
  FaSoundcloud,
  FaTiktok,
  FaTumblr,
  FaTwitch,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { SiDailymotion, SiImgur, SiRumble } from "react-icons/si";
import { letterIcon } from "@/components/LetterIcon";

export type PlatformId =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "x"
  | "pinterest"
  | "snapchat"
  | "dailymotion"
  | "twitch"
  | "linkedin"
  | "reddit"
  | "soundcloud"
  | "bluesky"
  | "tumblr"
  | "streamable"
  | "rumble"
  | "9gag"
  | "imgur"
  | "youtube";

export interface Platform {
  id: PlatformId;
  name: string;
  icon: IconType;
  /** Brand colour; a CSS colour, so black/white brands can follow the theme. */
  color: string;
  domains: string[];
  example: string;
  content: string[];
  /** Shown as a tab; the rest live under "More". */
  primary?: boolean;
}

// Keep domains in sync with PLATFORMS in api/_common.py.
// YouTube is disabled for now (it bot-blocks Vercel's servers); its id stays in
// PlatformId so the backend's YouTube responses still type-check.
export const PLATFORMS: Platform[] = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: FaTiktok,
    color: "#25F4EE",
    domains: ["tiktok.com"],
    example: "https://www.tiktok.com/@user/video/...",
    content: ["Videos", "Original sound", "HD quality"],
    primary: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: FaInstagram,
    color: "#E1306C",
    domains: ["instagram.com"],
    example: "https://www.instagram.com/reel/...",
    content: ["Reels", "Video posts", "Stories"],
    primary: true,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: FaFacebook,
    color: "#1877F2",
    domains: ["facebook.com", "fb.watch", "fb.com"],
    example: "https://www.facebook.com/watch?v=...",
    content: ["Videos", "Reels", "Watch"],
    primary: true,
  },
  {
    id: "x",
    name: "X",
    icon: FaXTwitter,
    color: "var(--foreground)",
    domains: ["x.com", "twitter.com", "t.co"],
    example: "https://x.com/user/status/...",
    content: ["Videos", "GIFs", "Broadcasts"],
    primary: true,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: FaPinterest,
    color: "#E60023",
    domains: [
      "pinterest.com",
      "pinterest.co.uk",
      "pinterest.ca",
      "pinterest.com.au",
      "pinterest.de",
      "pinterest.fr",
      "pinterest.es",
      "pinterest.it",
      "pinterest.jp",
      "pin.it",
    ],
    example: "https://pin.it/... or https://www.pinterest.com/pin/...",
    content: ["Video pins", "Idea pins"],
    primary: true,
  },
  {
    id: "snapchat",
    name: "Snapchat",
    icon: FaSnapchat,
    color: "#F7D000",
    domains: ["snapchat.com"],
    example: "https://www.snapchat.com/spotlight/...",
    content: ["Spotlight", "Public stories"],
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: FaReddit,
    color: "#FF4500",
    domains: ["reddit.com", "redd.it"],
    example: "https://www.reddit.com/r/.../comments/...",
    content: ["Videos with sound", "GIFs"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: FaLinkedin,
    color: "#0A66C2",
    domains: ["linkedin.com"],
    example: "https://www.linkedin.com/posts/...",
    content: ["Post videos"],
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: FaTwitch,
    color: "#9146FF",
    domains: ["twitch.tv"],
    example: "https://clips.twitch.tv/... or https://www.twitch.tv/videos/...",
    content: ["Clips", "Past broadcasts"],
  },
  {
    id: "dailymotion",
    name: "Dailymotion",
    icon: SiDailymotion,
    color: "#0D6EFD",
    domains: ["dailymotion.com", "dai.ly"],
    example: "https://www.dailymotion.com/video/...",
    content: ["Videos up to 1080p"],
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    icon: FaSoundcloud,
    color: "#FF5500",
    domains: ["soundcloud.com"],
    example: "https://soundcloud.com/artist/track",
    content: ["Tracks (audio)"],
  },
  {
    id: "bluesky",
    name: "Bluesky",
    icon: FaBluesky,
    color: "#1185FE",
    domains: ["bsky.app"],
    example: "https://bsky.app/profile/.../post/...",
    content: ["Post videos"],
  },
  {
    id: "tumblr",
    name: "Tumblr",
    icon: FaTumblr,
    color: "#5B8DEF",
    domains: ["tumblr.com"],
    example: "https://www.tumblr.com/blog/post/...",
    content: ["Post videos"],
  },
  {
    id: "rumble",
    name: "Rumble",
    icon: SiRumble,
    color: "#85C742",
    domains: ["rumble.com"],
    example: "https://rumble.com/v...html",
    content: ["Videos up to 1080p"],
  },
  {
    id: "streamable",
    name: "Streamable",
    icon: letterIcon("S"),
    color: "#0F90FA",
    domains: ["streamable.com"],
    example: "https://streamable.com/...",
    content: ["Videos"],
  },
  {
    id: "9gag",
    name: "9GAG",
    icon: letterIcon("9"),
    color: "var(--foreground)",
    domains: ["9gag.com"],
    example: "https://9gag.com/gag/...",
    content: ["Videos", "GIFs"],
  },
  {
    id: "imgur",
    name: "Imgur",
    icon: SiImgur,
    color: "#1BB76E",
    domains: ["imgur.com"],
    example: "https://imgur.com/...",
    content: ["Videos", "GIFs"],
  },
];

const YOUTUBE: Platform = {
  id: "youtube",
  name: "YouTube",
  icon: FaYoutube,
  color: "#FF0033",
  domains: [],
  example: "",
  content: [],
};

export function getPlatform(id: PlatformId): Platform {
  return PLATFORMS.find((p) => p.id === id) ?? YOUTUBE;
}

/** Colour with transparency; works with hex and CSS-variable colours. */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
