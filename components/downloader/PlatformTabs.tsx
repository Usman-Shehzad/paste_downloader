"use client";

import { PLATFORMS, type PlatformId } from "@/lib/platforms";

interface Props {
  selected: PlatformId;
  onSelect: (id: PlatformId) => void;
}

export default function PlatformTabs({ selected, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Platform"
      className="grid grid-cols-4 gap-1 rounded-2xl border border-border bg-surface-2 p-1"
    >
      {PLATFORMS.map(({ id, name, icon: Icon, color }) => {
        const active = id === selected;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(id)}
            className={`group relative flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-medium transition-all ${
              active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            <Icon
              size={20}
              className="shrink-0 transition-transform group-hover:scale-110"
              style={{ color: active ? color : undefined }}
            />
            <span className="hidden sm:inline">{name}</span>
            {active && (
              <span
                className="absolute inset-x-6 -bottom-px h-0.5 rounded-full"
                style={{ background: color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
