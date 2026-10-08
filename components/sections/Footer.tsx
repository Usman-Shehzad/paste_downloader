import Link from "next/link";
import { PLATFORM_PAGES } from "@/lib/seo";
import { SITE } from "@/lib/site";
import Logo from "../Logo";

const LINK = "transition hover:text-foreground";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">
            Paste a link, pick a quality, download. Fast and free video downloads from your favourite platforms.
          </p>
        </div>
        <div className="sm:col-span-2">
          <h4 className="text-sm font-semibold">Downloaders</h4>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-muted">
            {PLATFORM_PAGES.map(({ slug, platform: { name, icon: Icon } }) => (
              <li key={slug}>
                <Link href={`/${slug}`} className={`flex items-center gap-2 ${LINK}`}>
                  <Icon className="shrink-0" /> {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Help</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li><Link href="/#how-it-works" className={LINK}>How it works</Link></li>
            <li><Link href="/#features" className={LINK}>Features</Link></li>
            <li><Link href="/#faq" className={LINK}>FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li><Link href="/terms" className={LINK}>Terms of Use</Link></li>
            <li><Link href="/privacy" className={LINK}>Privacy Policy</Link></li>
            <li><Link href="/dmca" className={LINK}>Copyright / DMCA</Link></li>
            <li><a href={`mailto:${SITE.email}`} className={LINK}>Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
            <p>Download only content you own or have permission to use.</p>
          </div>
          <p className="opacity-80">
            {SITE.name} is not affiliated with TikTok, Instagram, Facebook, X or any other platform listed. All
            trademarks belong to their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
