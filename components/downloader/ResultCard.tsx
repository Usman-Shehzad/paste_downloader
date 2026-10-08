"use client";

import { useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiDownload, FiFilm, FiMusic, FiPlay, FiRefreshCw, FiUser } from "react-icons/fi";
import { downloadUrl, formatBytes, formatDuration, type VideoFormat, type VideoInfo } from "@/lib/api";
import { getPlatform } from "@/lib/platforms";
import PreviewModal, { canPreview } from "./PreviewModal";

interface Props {
  info: VideoInfo;
  url: string;
  onReset: () => void;
}

type Tab = "video" | "audio";

export default function ResultCard({ info, url, onReset }: Props) {
  const videos = info.formats.filter((f) => f.kind === "video");
  const audios = info.formats.filter((f) => f.kind === "audio");
  const [tab, setTab] = useState<Tab>(videos.some((f) => f.available) ? "video" : "audio");
  const list = tab === "video" ? videos : audios;
  const [formatId, setFormatId] = useState<string | null>(
    () => list.find((f) => f.available)?.format_id ?? null,
  );
  const [started, setStarted] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const { icon: Icon, color, name } = getPlatform(info.platform);
  const watchable = canPreview(info);
  const selected = info.formats.find((f) => f.format_id === formatId);

  function switchTab(next: Tab) {
    setTab(next);
    const first = (next === "video" ? videos : audios).find((f) => f.available);
    setFormatId(first?.format_id ?? null);
    setStarted(false);
  }

  return (
    <div className="animate-fade-up grid gap-5 md:grid-cols-[minmax(0,240px)_1fr]">
      <div className="flex flex-col gap-3">
        <div className="group relative aspect-video overflow-hidden rounded-2xl bg-surface-2 md:aspect-[4/5]">
          {info.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.thumbnail}
              alt=""
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          )}
          {watchable && (
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              aria-label="Watch video"
              className="absolute inset-0 grid place-items-center bg-black/20 transition hover:bg-black/40"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-black shadow-xl transition group-hover:scale-110">
                <FiPlay size={22} className="ml-1" />
              </span>
            </button>
          )}
          <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <Icon style={{ color }} /> {info.is_short ? `${name} Shorts` : name}
          </span>
          {info.duration ? (
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-xs font-medium text-white">
              {formatDuration(info.duration)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <h2 className="line-clamp-2 text-lg font-semibold leading-snug">{info.title}</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
            {info.uploader && (
              <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1">
                <FiUser /> {info.uploader}
              </span>
            )}
            {info.duration ? (
              <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1">
                <FiClock /> {formatDuration(info.duration)}
              </span>
            ) : null}
            {info.formats.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1">
                <FiFilm /> {info.formats.length} formats
              </span>
            )}
          </div>
        </div>

        {info.notice ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
            <FiAlertTriangle className="mt-0.5 shrink-0" />
            <p>{info.notice}</p>
          </div>
        ) : (
          <>
        <div role="tablist" className="flex gap-1 self-start rounded-xl bg-surface-2 p-1 text-sm">
          {(
            [
              ["video", FiFilm, `Video (${videos.length})`],
              ["audio", FiMusic, `Audio (${audios.length})`],
            ] as const
          ).map(([id, TabIcon, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => switchTab(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium transition ${
                tab === id ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              <TabIcon /> {label}
            </button>
          ))}
        </div>

        {list.length ? (
          <div role="radiogroup" aria-label="Quality" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {list.map((f) => {
              const active = f.format_id === formatId;
              const hd = (f.height ?? 0) >= 720;
              return (
                <button
                  key={f.format_id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!f.available}
                  onClick={() => {
                    setFormatId(f.format_id);
                    setStarted(false);
                  }}
                  title={f.available ? undefined : "This quality isn't available right now"}
                  className={`relative rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? "border-accent bg-accent/10 ring-2 ring-accent/20"
                      : "border-border bg-surface hover:border-accent/50"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {f.quality}
                    {f.fps && f.fps > 30 ? (
                      <span className="text-[10px] font-semibold text-muted">{Math.round(f.fps)}fps</span>
                    ) : null}
                    {hd && (
                      <span className="rounded bg-gradient-accent px-1 text-[10px] font-bold text-white">
                        {(f.height ?? 0) >= 2160 ? "4K" : (f.height ?? 0) >= 1440 ? "2K" : "HD"}
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted">
                    {f.available
                      ? [f.ext.toUpperCase(), sizeLabel(f)].filter(Boolean).join(" · ")
                      : "Unavailable"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">No {tab} formats available.</p>
        )}
          </>
        )}

        <div className="mt-auto flex flex-col gap-2">
          {selected ? (
            // A plain link lets the browser handle the streamed file with its native download UI.
            <a
              href={downloadUrl(url, selected.format_id)}
              download
              onClick={() => setStarted(true)}
              className="bg-gradient-accent flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-110 active:scale-[0.98]"
            >
              <FiDownload className="shrink-0" />
              Download {selected.kind === "audio" ? "audio" : selected.quality}
              {selected.filesize ? <span className="font-medium opacity-80">· {sizeLabel(selected)}</span> : null}
            </a>
          ) : (
            <button disabled className="h-12 w-full rounded-xl bg-surface-2 font-semibold text-muted">
              {info.notice ? "Download unavailable" : "Choose a quality"}
            </button>
          )}
          <div className={`grid gap-2 ${watchable ? "grid-cols-2" : "grid-cols-1"}`}>
            {watchable && (
              <button
                onClick={() => setPreviewing(true)}
                className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
              >
                <FiPlay /> Watch
              </button>
            )}
            <button
              onClick={onReset}
              className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
            >
              <FiRefreshCw /> New link
            </button>
          </div>
        </div>
        {started && (
          <p className="animate-fade-up flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <FiCheckCircle />
            {selected?.needs_ffmpeg
              ? "Preparing your file. The download starts in a few seconds."
              : "Download started. Check your browser's downloads."}
          </p>
        )}
      </div>
      {previewing && <PreviewModal info={info} url={url} onClose={() => setPreviewing(false)} />}
    </div>
  );
}

// Merged and HLS sizes are estimated (stream sums or bitrate x duration).
function sizeLabel(f: VideoFormat): string {
  const size = formatBytes(f.filesize);
  return size && f.needs_ffmpeg ? `~${size}` : size;
}

export function ResultSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,240px)_1fr]">
      <div className="skeleton aspect-video rounded-2xl md:aspect-[4/5]" />
      <div className="flex flex-col gap-3">
        <div className="skeleton h-5 w-full rounded-lg" />
        <div className="skeleton h-5 w-2/3 rounded-lg" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
        <div className="skeleton mt-2 h-9 w-48 rounded-xl" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
