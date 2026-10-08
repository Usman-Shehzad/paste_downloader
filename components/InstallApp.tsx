"use client";

import { useEffect, useState } from "react";
import { FiDownloadCloud } from "react-icons/fi";

// Chrome/Edge/Android fire this before showing their own install prompt.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Registers the service worker and shows "Install app" when the browser allows it. */
export default function InstallApp({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
      }}
      className={`flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold transition hover:border-accent/50 hover:bg-surface-2 ${className}`}
    >
      <FiDownloadCloud /> Install app
    </button>
  );
}
