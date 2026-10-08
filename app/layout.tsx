import type { Metadata, Viewport } from "next";
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
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
