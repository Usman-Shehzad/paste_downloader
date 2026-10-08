"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiExternalLink, FiX } from "react-icons/fi";
import { downloadUrl, previewFormat, type VideoInfo } from "@/lib/api";
import { getPlatform } from "@/lib/platforms";

interface Props {
  info: VideoInfo;
  url: string;
  onClose: () => void;
}

// Vertical-video apps default to portrait; others follow the video's shape.
const PORTRAIT_PLATFORMS = new Set(["tiktok", "instagram", "snapchat"]);

function isPortrait(info: VideoInfo): boolean {
  if (info.is_short) return true;
  if (info.width && info.height) return info.height > info.width;
  return PORTRAIT_PLATFORMS.has(info.platform);
}

export function canPreview(info: VideoInfo): boolean {
  return Boolean(info.embed_url || previewFormat(info));
}

export default function PreviewModal({ info, url, onClose }: Props) {
  const { name, icon: Icon, color } = getPlatform(info.platform);
  const portrait = isPortrait(info);
  // Official embed where it works (TikTok), else stream the smallest format ourselves.
  const preview = info.embed_url ? null : previewFormat(info);
  const isAudio = preview?.kind === "audio";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!info.embed_url && !preview) return null;

  // Portal to <body>: the downloader card uses backdrop-filter, which would turn
  // this fixed overlay into one positioned (and clipped) inside the card.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${info.title}`}
      onClick={onClose}
      className="animate-fade-up fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
    >
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-3">
        {/* w-0 min-w-full: the title bar follows the player's width instead of the title's length. */}
        <div className="flex w-0 min-w-full items-center justify-between gap-4 text-white">
          <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <Icon className="shrink-0" style={{ color }} />
            <span className="truncate">{info.title}</span>
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FiExternalLink /> <span className="hidden sm:inline">Open on {name}</span>
            </a>
            <button
              onClick={onClose}
              aria-label="Close preview"
              className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        {isAudio && preview ? (
          <div className="flex w-[min(92vw,480px)] flex-col gap-4 rounded-2xl bg-surface p-4 shadow-2xl ring-1 ring-white/10">
            {info.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.thumbnail} alt="" referrerPolicy="no-referrer" className="aspect-square w-full rounded-xl object-cover" />
            )}
            <audio src={downloadUrl(url, preview.format_id, { item: info.item, inline: true })} controls autoPlay className="w-full" />
          </div>
        ) : (
          <div
            // Fill as much of the screen as the aspect ratio allows (minus the title bar).
            className={`shrink-0 overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10 ${
              portrait
                ? "aspect-[9/16] w-[min(94vw,calc((100dvh-6.5rem)*9/16))]"
                : "aspect-video w-[min(94vw,1400px,calc((100dvh-6.5rem)*16/9))]"
            }`}
          >
            {info.embed_url ? (
              <iframe
                src={info.embed_url}
                title={info.title}
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              preview && (
                <video
                  src={downloadUrl(url, preview.format_id, { item: info.item, inline: true })}
                  poster={info.thumbnail ?? undefined}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full object-contain"
                />
              )
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
