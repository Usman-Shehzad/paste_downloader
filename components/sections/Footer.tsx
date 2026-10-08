import { PLATFORMS } from "@/lib/platforms";
import Logo from "../Logo";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">
            Paste a link, pick a quality, download. Fast and free video downloads from your favourite platforms.
          </p>
        </div>
        <div className="lg:col-span-2">
          <h4 className="text-sm font-semibold">Downloaders</h4>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-muted">
            {PLATFORMS.map(({ id, name, icon: Icon }) => (
              <li key={id}>
                <a href="#download" className="flex items-center gap-2 transition hover:text-foreground">
                  <Icon className="shrink-0" /> {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Help</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li><a href="#how-it-works" className="transition hover:text-foreground">How it works</a></li>
            <li><a href="#features" className="transition hover:text-foreground">Features</a></li>
            <li><a href="#faq" className="transition hover:text-foreground">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Paste Cap. All rights reserved.</p>
          <p>Download only content you own or have permission to use.</p>
        </div>
      </div>
    </footer>
  );
}
