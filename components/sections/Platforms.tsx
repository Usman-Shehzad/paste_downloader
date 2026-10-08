import { FiCheck } from "react-icons/fi";
import { PLATFORMS } from "@/lib/platforms";
import SectionHeading from "./SectionHeading";

export default function Platforms() {
  return (
    <section id="platforms" className="scroll-mt-20 py-24">
      <SectionHeading
        eyebrow="Platforms"
        title="One box for every platform"
        subtitle="Paste a link from any of these and Paste Cap detects the platform automatically."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map(({ id, name, icon: Icon, color, content, domains }) => (
          <div
            key={id}
            className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-6 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40"
              style={{ background: color }}
              aria-hidden
            />
            <div
              className="grid h-12 w-12 place-items-center rounded-2xl"
              style={{ background: `${color}1f`, color }}
            >
              <Icon size={26} />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{name} Downloader</h3>
            <p className="mt-1 text-xs text-muted">{domains.join(" · ")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {content.map((c) => (
                <li key={c} className="flex items-center gap-2 text-muted">
                  <FiCheck className="text-emerald-500" /> {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
