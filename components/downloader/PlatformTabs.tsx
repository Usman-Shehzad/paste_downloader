"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { getPlatform, PLATFORMS, tint, type Platform, type PlatformId } from "@/lib/platforms";

interface Props {
  selected: PlatformId;
  onSelect: (id: PlatformId) => void;
}

const PRIMARY = PLATFORMS.filter((p) => p.primary);
const MORE = PLATFORMS.filter((p) => !p.primary);

export default function PlatformTabs({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // A platform picked from "More" joins the tab row while it's selected.
  const extra = PRIMARY.some((p) => p.id === selected) ? null : getPlatform(selected);
  const tabs = extra ? [...PRIMARY, extra] : PRIMARY;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(id: PlatformId) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative flex gap-1 rounded-2xl border border-border bg-surface-2 p-1">
      <div role="tablist" aria-label="Platform" className="flex min-w-0 flex-1 gap-1">
        {tabs.map((p) => (
          <Tab key={p.id} platform={p} active={p.id === selected} onClick={() => pick(p.id)} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2.5 text-sm font-medium transition sm:px-3 ${
          open ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
        }`}
      >
        <span className="hidden sm:inline">More</span>
        <span className="rounded-md bg-border/70 px-1.5 text-xs sm:hidden">+{MORE.length}</span>
        <FiChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 top-full z-30 mt-2 grid w-[min(calc(100vw-2rem),460px)] grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-2 shadow-2xl sm:grid-cols-3"
        >
          {PLATFORMS.map(({ id, name, icon: Icon, color }) => (
            <button
              key={id}
              role="menuitemradio"
              aria-checked={id === selected}
              onClick={() => pick(id)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-surface-2 ${
                id === selected ? "bg-surface-2 ring-1 ring-border" : ""
              }`}
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                style={{ background: tint(color, 14), color }}
              >
                <Icon size={17} />
              </span>
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Tab({ platform, active, onClick }: { platform: Platform; active: boolean; onClick: () => void }) {
  const { name, icon: Icon, color } = platform;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={name}
      title={name}
      onClick={onClick}
      className={`group relative flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-medium transition-all ${
        active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
      }`}
    >
      <Icon
        size={19}
        className="shrink-0 transition-transform group-hover:scale-110"
        style={{ color: active ? color : undefined }}
      />
      <span className="hidden truncate lg:inline">{name}</span>
      {active && <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full" style={{ background: color }} />}
    </button>
  );
}
