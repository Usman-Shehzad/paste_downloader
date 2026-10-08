import type { MetadataRoute } from "next";
import { PLATFORM_PAGES } from "@/lib/seo";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...PLATFORM_PAGES.map(({ slug }) => ({
      url: `${SITE.url}/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...["terms", "privacy", "dmca"].map((path) => ({
      url: `${SITE.url}/${path}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
