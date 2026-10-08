import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd, { faqJsonLd } from "@/components/JsonLd";
import CallToAction from "@/components/sections/CallToAction";
import Faq from "@/components/sections/Faq";
import Features from "@/components/sections/Features";
import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import Navbar from "@/components/sections/Navbar";
import SectionHeading from "@/components/sections/SectionHeading";
import { tint } from "@/lib/platforms";
import { PLATFORM_PAGES, pageForSlug } from "@/lib/seo";
import { SITE } from "@/lib/site";

// One static page per platform, e.g. /tiktok-downloader. Unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return PLATFORM_PAGES.map(({ slug }) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = pageForSlug((await params).slug);
  if (!page) return {};
  const title = `${page.keyword}: Download ${page.noun} in HD, Free`;
  const description = `Download ${page.noun} online in the best quality, or save the audio as MP3. Free, fast, no sign-up and no app needed. Paste a ${page.platform.name} link and go.`;
  return {
    title,
    description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { title, description, url: `/${page.slug}` },
  };
}

export default async function PlatformLanding({ params }: Params) {
  const page = pageForSlug((await params).slug);
  if (!page) notFound();
  const { platform } = page;

  return (
    <>
      <JsonLd data={faqJsonLd(page.faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: `How to download ${page.noun}`,
          step: [
            { "@type": "HowToStep", name: "Copy the link", text: page.copyLink },
            { "@type": "HowToStep", name: "Paste it", text: `Paste the link into ${SITE.name}'s ${platform.name} tab.` },
            { "@type": "HowToStep", name: "Download", text: "Pick a quality, or MP3, and tap Download." },
          ],
        }}
      />
      <Navbar />
      <main className="relative overflow-x-clip">
        <Hero
          initialPlatform={platform.id}
          title={
            <>
              <span className="text-gradient">{page.keyword}</span>
            </>
          }
          subtitle={`Download ${page.noun} in HD, or save the sound as MP3. Free, no sign-up, works on phone and desktop.`}
        />
        <div className="mx-auto max-w-6xl px-4">
          <HowItWorks
            title={`How to download ${page.noun}`}
            steps={[
              { title: "Copy the link", text: page.copyLink },
              { title: "Paste it here", text: `Paste the link into the box above, with the ${platform.name} tab selected.` },
              { title: "Download", text: "Pick a quality, or MP3 for audio only, and tap Download." },
            ]}
          />
          <Features />
          <Faq title={`${platform.name} downloader FAQ`} items={page.faqs} />

          <section className="pb-24">
            <SectionHeading eyebrow="More downloaders" title="Other platforms" />
            <div className="flex flex-wrap justify-center gap-2">
              {PLATFORM_PAGES.filter((p) => p.slug !== page.slug).map(({ slug, keyword, platform: p }) => (
                <Link
                  key={slug}
                  href={`/${slug}`}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: tint(p.color, 14), color: p.color }}>
                    <p.icon size={13} />
                  </span>
                  {keyword}
                </Link>
              ))}
            </div>
          </section>

          <CallToAction text={`Copy a ${platform.name} link and paste it in.`} />
        </div>
      </main>
      <Footer />
    </>
  );
}
