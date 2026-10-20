import Link from "next/link";
import { FiArrowUpRight, FiCheck } from "react-icons/fi";
import { PLATFORMS, tint } from "@/lib/platforms";
import { pageForPlatform } from "@/lib/seo";
import SectionHeading from "./SectionHeading";
import Reveal from "@/components/motion/Reveal";

export default function Platforms() {
  return (
    <section id="platforms" className="scroll-mt-20 py-24">
      <SectionHeading
        eyebrow="Platforms"
        title={`${PLATFORMS.length} platforms, one box`}
        subtitle="Pick the platform, paste the link, and choose your quality."
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {PLATFORMS.map(({ id, name, icon: Icon, color, content, domains }, i) => (
          // Cards in a row appear one after another.
          <Reveal key={id} delay={(i % 4) * 80} className="h-full">
          <Link
            href={`/${pageForPlatform(id)?.slug ?? ""}`}
            className="spotlight group relative block h-full overflow-hidden rounded-3xl border border-border bg-surface p-4 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5"
          >
            <FiArrowUpRight className="absolute right-4 top-4 text-muted opacity-0 transition group-hover:opacity-100" />
            <div
              className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40"
              style={{ background: color }}
              aria-hidden
            />
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl transition duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-6 group-hover:scale-110"
              style={{ background: tint(color, 12), color }}
            >
              <Icon size={26} />
            </div>
            <h3 className="mt-4 font-semibold sm:text-lg">{name} Downloader</h3>
            <p className="mt-1 truncate text-xs text-muted">{domains.slice(0, 2).join(" · ")}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {content.map((c) => (
                <li key={c} className="flex items-start gap-2 text-muted">
                  <FiCheck className="mt-0.5 shrink-0 text-emerald-500" /> {c}
                </li>
              ))}
            </ul>
          </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
