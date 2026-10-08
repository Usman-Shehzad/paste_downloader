import JsonLd, { faqJsonLd } from "@/components/JsonLd";
import CallToAction from "@/components/sections/CallToAction";
import Faq, { HOME_FAQS } from "@/components/sections/Faq";
import Features from "@/components/sections/Features";
import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import Navbar from "@/components/sections/Navbar";
import Platforms from "@/components/sections/Platforms";
import { PLATFORMS } from "@/lib/platforms";
import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: SITE.name,
          url: SITE.url,
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <JsonLd data={faqJsonLd(HOME_FAQS)} />
      <Navbar />
      <main className="relative overflow-x-clip">
        <Hero
          title={
            <>
              Paste the link.
              <br />
              <span className="text-gradient">Capture the video.</span>
            </>
          }
          subtitle={
            <>
              Download videos, Reels and audio from TikTok, Instagram, Facebook, X and {PLATFORMS.length - 4} more
              platforms in the quality you want, in seconds.
            </>
          }
        />
        <div className="mx-auto max-w-6xl px-4">
          <Platforms />
          <HowItWorks />
          <Features />
          <Faq />
          <CallToAction />
        </div>
      </main>
      <Footer />
    </>
  );
}
