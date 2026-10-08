/**
 * Site-wide settings. Set NEXT_PUBLIC_SITE_URL to your domain and
 * NEXT_PUBLIC_CONTACT_EMAIL to a real inbox (used on the legal pages).
 * On Vercel the production URL is picked up automatically if the first isn't set.
 */
export const SITE = {
  name: "Paste Cap",
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  ).replace(/\/$/, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@example.com",
  tagline: "Paste the link. Capture the video.",
};
