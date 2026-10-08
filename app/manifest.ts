import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name}: Video Downloader`,
    short_name: SITE.name,
    description: "Paste a link from TikTok, Instagram, Facebook, X and more, and download the video or MP3.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#09090d",
    theme_color: "#09090d",
    categories: ["utilities", "multimedia"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Android: once installed, Paste Cap appears in other apps' Share menus.
    // Shared links arrive as /?url=…&text=…&title=… and the downloader picks them up.
    share_target: {
      action: "/",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
