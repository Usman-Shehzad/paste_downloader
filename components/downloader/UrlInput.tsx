"use client";

import { FiArrowRight, FiClipboard, FiLink, FiLoader, FiX } from "react-icons/fi";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  placeholder: string;
  invalid?: boolean;
}

export default function UrlInput({ value, onChange, onSubmit, loading, placeholder, invalid }: Props) {
  async function pasteFromClipboard() {
    try {
      onChange((await navigator.clipboard.readText()).trim());
    } catch {
      // Clipboard permission denied: the user can still paste manually.
    }
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="relative flex-1">
        <FiLink className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="url"
          inputMode="url"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Video URL"
          aria-invalid={invalid}
          className={`h-14 w-full rounded-2xl border bg-surface-2 pl-11 pr-28 text-base outline-none transition placeholder:text-muted/70 focus:bg-surface focus:ring-4 ${
            invalid
              ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/15"
              : "border-border focus:border-accent focus:ring-accent/15"
          }`}
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear"
              className="rounded-xl p-2.5 text-muted transition hover:bg-border/60 hover:text-foreground"
            >
              <FiX />
            </button>
          ) : (
            <button
              type="button"
              onClick={pasteFromClipboard}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground"
            >
              <FiClipboard /> Paste
            </button>
          )}
        </div>
      </div>
      <button
        type="submit"
        disabled={!value || loading}
        className="bg-gradient-accent flex h-14 items-center justify-center gap-2 rounded-2xl px-7 font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? (
          <>
            <FiLoader className="animate-spin" /> Fetching
          </>
        ) : (
          <>
            Get video <FiArrowRight />
          </>
        )}
      </button>
    </form>
  );
}
