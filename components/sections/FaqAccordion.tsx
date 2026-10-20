"use client";

import { useId, useState } from "react";
import Reveal from "@/components/motion/Reveal";
import type { Faq } from "@/lib/seo";

/** One-open-at-a-time accordion with smooth height animation. */
export default function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ q, a }, i) => {
        const isOpen = open === i;
        const buttonId = `${baseId}-q${i}`;
        const panelId = `${baseId}-a${i}`;
        return (
          <Reveal key={q} delay={i * 60}>
            <div
              className={`spotlight group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                isOpen
                  ? "border-accent/40 bg-surface shadow-xl shadow-accent/5"
                  : "border-border bg-surface/60 hover:border-accent/30 hover:bg-surface"
              }`}
            >
              {/* Accent bar on the open question. */}
              <span
                aria-hidden
                className={`bg-gradient-accent absolute inset-y-4 left-0 w-1 origin-center rounded-r-full transition-transform duration-500 ${
                  isOpen ? "scale-y-100" : "scale-y-0"
                }`}
              />
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                >
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums transition-colors ${
                      isOpen ? "text-gradient" : "text-muted"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-medium sm:text-lg">{q}</span>
                  <PlusMinus open={isOpen} />
                </button>
              </h3>
              {/* grid-rows 0fr → 1fr animates to the content's natural height. */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 pl-[3.25rem] text-sm leading-relaxed text-muted sm:px-6 sm:pb-6 sm:pl-[3.75rem] sm:text-base">
                    {a}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

function PlusMinus({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
        open
          ? "bg-gradient-accent rotate-180 border-transparent text-white shadow-md shadow-accent/30"
          : "border-border text-muted group-hover:border-accent/40 group-hover:text-foreground"
      }`}
    >
      <span className="absolute h-0.5 w-3.5 rounded-full bg-current" />
      <span
        className={`absolute h-3.5 w-0.5 rounded-full bg-current transition-transform duration-300 ${
          open ? "scale-y-0" : "scale-y-100"
        }`}
      />
    </span>
  );
}
