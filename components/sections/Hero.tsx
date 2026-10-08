import type { ReactNode } from "react";
import { FiShield, FiZap } from "react-icons/fi";
import Downloader from "@/components/downloader/Downloader";
import { PLATFORMS, type PlatformId } from "@/lib/platforms";

interface Props {
  title: ReactNode;
  subtitle: ReactNode;
  initialPlatform?: PlatformId;
}

/** Headline, the downloader card and the trust row; shared by every landing page. */
export default function Hero({ title, subtitle, initialPlatform }: Props) {
  return (
    <>
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[720px]" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-[-200px] h-[600px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--glow), transparent)" }}
        aria-hidden
      />

      <section className="relative mx-auto max-w-3xl px-4 pb-16 pt-16 sm:pt-24">
        <div className="animate-fade-up text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Free · No sign-up · HD quality
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">{title}</h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">{subtitle}</p>
        </div>

        {/* z-20: the fade-in animation makes this its own stacking context, so
            the "More" menu inside must sit above the content that follows. */}
        <div className="animate-fade-up relative z-20 mt-10 [animation-delay:120ms]">
          <Downloader initialPlatform={initialPlatform} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <FiZap className="text-accent" /> Instant streaming
          </span>
          <span className="flex items-center gap-1.5">
            <FiShield className="text-accent" /> No files stored
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {PLATFORMS.map(({ id, name, icon: Icon, color }) => (
            <Icon
              key={id}
              title={name}
              style={{ color }}
              size={18}
              className="opacity-80 transition hover:scale-125 hover:opacity-100"
            />
          ))}
        </div>
      </section>
    </>
  );
}
