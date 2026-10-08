import Link from "next/link";
import { FiArrowUpRight, FiCheck } from "react-icons/fi";
import { PLATFORMS, tint } from "@/lib/platforms";
import { pageForPlatform } from "@/lib/seo";
import SectionHeading from "./SectionHeading";

export default function Platforms() {
  return (
    <section id="platforms" className="scroll-mt-20 py-24">
      <SectionHeading
        eyebrow="Platforms"
        title={`${PLATFORMS.length} platforms, one box`}
        subtitle="Pick the platform, paste the link, and choose your quality."
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {PLATFORMS.map(({ id, name, icon: Icon, color, content, domains }) => (
          <Link
            key={id}
            href={`/${pageForPlatform(id)?.slug ?? ""}`}
            className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-4 transition hover:-translate-y-1 hover:shadow-xl sm:p-5"
          >
            <FiArrowUpRight className="absolute right-4 top-4 text-muted opacity-0 transition group-hover:opacity-100" />
            <div
              className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40"
              style={{ background: color }}
              aria-hidden
            />
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl"
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
        ))}
      </div>
    </section>
  );
}
