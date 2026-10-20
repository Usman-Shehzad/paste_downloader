import type { Metadata, Viewport } from "next";
import Cursor from "@/components/motion/Cursor";
import PointerEffects from "@/components/motion/PointerEffects";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Paste Cap: TikTok, Instagram, Facebook, X & More Video Downloader",
    template: "%s | Paste Cap",
  },
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE.name, url: "/" },
  twitter: { card: "summary_large_image" },
  description:
    "Paste a link from TikTok, Instagram, Facebook, X, Pinterest, Reddit and 11 more platforms and download the video or audio in the quality you want. Free, no sign-up.",
  icons: { icon: "/icon.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#09090d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script adds the "js" class before React loads.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Marks that JS runs, so scroll-reveal content is only hidden when it can be revealed. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        {/* Thin bar at the top showing how far the page is scrolled. */}
        <div className="scroll-progress" aria-hidden />
        <PointerEffects />
        <Cursor />
        {children}
      </body>
    </html>
  );
}
