"use client";

import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import InstallApp from "../InstallApp";
import Logo from "../Logo";

const LINKS = [
  { href: "/#platforms", label: "Platforms" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#faq", label: "FAQ" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <InstallApp />
          <a
            href="#download"
            className="bg-gradient-accent hidden rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md shadow-accent/25 transition hover:brightness-110 md:block"
          >
            Start downloading
          </a>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
            className="rounded-lg p-2 text-muted hover:bg-surface-2 md:hidden"
          >
            {open ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </nav>
      {open && (
        <ul className="animate-fade-up border-t border-border px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 font-medium text-muted hover:bg-surface-2 hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
