"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiAlertTriangle } from "react-icons/fi";
import { fetchInfo, type VideoInfo } from "@/lib/api";
import { detectPlatform } from "@/lib/detectPlatform";
import { getPlatform, type PlatformId } from "@/lib/platforms";
import PlatformTabs from "./PlatformTabs";
import ResultCard, { ResultSkeleton } from "./ResultCard";
import UrlInput from "./UrlInput";

export default function Downloader({ initialPlatform = "tiktok" }: { initialPlatform?: PlatformId }) {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<PlatformId>(initialPlatform);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = url.trim();
  const detected = detectPlatform(trimmed);
  const current = getPlatform(platform);
  // The selected tab decides which links are accepted.
  const wrongTab = detected !== null && detected !== platform;
  const DetectedIcon = detected ? getPlatform(detected).icon : null;
  const invalid = trimmed !== "" && detected === null;

  const load = useCallback(async (target: string, tab: PlatformId) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      setInfo(await fetchInfo(target, tab, controller.signal));
    } catch (e) {
      if (!controller.signal.aborted) setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  // Links shared into the installed app (Android share sheet → manifest
  // share_target) or opened as /?url=… arrive in the query string. Apps often
  // share text like "Watch this! https://vt.tiktok.com/…", so pull out the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = ["url", "text", "title"].map((k) => params.get(k) ?? "").join(" ");
    const link = shared.match(/https?:\/\/[^\s"'<>]+/)?.[0];
    if (!link) return;
    const id = detectPlatform(link);
    if (id) setPlatform(id);
    setUrl(link);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // Fetch details once a link matching the selected tab is pasted.
  useEffect(() => {
    abortRef.current?.abort();
    setInfo(null);
    setLoading(false);
    if (detected !== platform) return;
    const t = setTimeout(() => load(trimmed, platform), 400);
    return () => clearTimeout(t);
  }, [trimmed, detected, platform, load]);

  function submit() {
    if (detected === platform) load(trimmed, platform);
  }

  function reset() {
    setUrl("");
    setInfo(null);
    setError(null);
  }

  return (
    <div id="download" className="relative scroll-mt-24">
      <div className="bg-gradient-accent absolute -inset-px rounded-[28px] opacity-30 blur-xl" aria-hidden />
      <div className="relative flex flex-col gap-4 rounded-[28px] border border-border bg-surface/90 p-3 shadow-2xl backdrop-blur-xl sm:p-5">
        <PlatformTabs
          selected={platform}
          onSelect={(id) => {
            setPlatform(id);
            setError(null);
          }}
        />

        <UrlInput
          value={url}
          onChange={(v) => {
            setUrl(v);
            setError(null);
          }}
          onSubmit={submit}
          loading={loading}
          invalid={invalid || wrongTab}
          placeholder={`Paste ${current.name} link here…`}
        />

        <div className="flex flex-wrap items-center gap-2 px-1 text-xs text-muted">
          <span>Supports:</span>
          {current.content.map((c) => (
            <span key={c} className="rounded-full border border-border px-2.5 py-0.5">
              {c}
            </span>
          ))}
        </div>

        {wrongTab && detected && (
          <div
            role="alert"
            className="animate-fade-up flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 sm:flex-row sm:items-center sm:justify-between dark:text-amber-300"
          >
            <span className="flex items-center gap-2">
              <FiAlertTriangle className="shrink-0" />
              This is a {getPlatform(detected).name} link, but the {current.name} tab is selected.
            </span>
            <button
              type="button"
              onClick={() => setPlatform(detected)}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-surface px-3 py-1.5 font-medium text-foreground shadow-sm transition hover:brightness-110"
            >
              {DetectedIcon && <DetectedIcon style={{ color: getPlatform(detected).color }} />} Switch to {getPlatform(detected).name}
            </button>
          </div>
        )}

        {invalid && (
          <p
            role="alert"
            className="animate-fade-up flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
          >
            <FiAlertCircle className="shrink-0" />
            That isn&apos;t a valid {current.name} link. It should look like {current.example}
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="animate-fade-up flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
          >
            <FiAlertCircle className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {(loading || info) && (
          <div className="border-t border-border pt-4">
            {info ? <ResultCard key={info.title + url} info={info} url={url.trim()} onReset={reset} /> : <ResultSkeleton />}
          </div>
        )}
      </div>
    </div>
  );
}
