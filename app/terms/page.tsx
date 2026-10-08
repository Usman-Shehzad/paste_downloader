import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms for using ${SITE.name}.`,
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="October 8, 2026">
      <section>
        <h2>1. About the service</h2>
        <p>
          {SITE.name} is a tool that fetches publicly available videos and audio from the link you paste and delivers
          them to your device. We don&apos;t host, store or index any media; each file is streamed from the original
          platform to you at the time you request it.
        </p>
      </section>
      <section>
        <h2>2. Your responsibility</h2>
        <ul>
          <li>Only download content you own, have permission to use, or may lawfully use (for example under fair use or a similar exception in your country).</li>
          <li>You are responsible for how you use downloaded files and for following each platform&apos;s terms of service.</li>
          <li>Don&apos;t use {SITE.name} to infringe copyright, harass people, or redistribute others&apos; work without permission.</li>
        </ul>
      </section>
      <section>
        <h2>3. Acceptable use</h2>
        <ul>
          <li>No automated or bulk use (bots, scrapers) and no attempts to overload or attack the service.</li>
          <li>No attempts to access private content or bypass a platform&apos;s access controls or DRM.</li>
        </ul>
        <p className="mt-3">We may limit or block access that breaks these rules.</p>
      </section>
      <section>
        <h2>4. No affiliation</h2>
        <p>
          {SITE.name} is independent and is not affiliated with, endorsed or sponsored by TikTok, Instagram, Meta,
          X, Pinterest, Snap, Reddit, LinkedIn, Twitch, Dailymotion, SoundCloud, Bluesky, Tumblr, Rumble, Streamable,
          9GAG, Imgur or any other platform. All trademarks belong to their owners.
        </p>
      </section>
      <section>
        <h2>5. No warranty</h2>
        <p>
          The service is provided &quot;as is&quot;, free of charge, without warranties of any kind. Platforms change
          often, so some links may stop working at any time. To the extent the law allows, we aren&apos;t liable for
          any loss arising from your use of the service.
        </p>
      </section>
      <section>
        <h2>6. Copyright complaints</h2>
        <p>
          If you believe {SITE.name} is being used to infringe your rights, see our <a href="/dmca">copyright (DMCA) policy</a>.
        </p>
      </section>
      <section>
        <h2>7. Changes</h2>
        <p>
          We may update these terms. The date above shows the latest version; continuing to use the service means you
          accept it. Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
