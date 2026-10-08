import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} handles your data.`,
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="October 8, 2026">
      <section>
        <h2>The short version</h2>
        <p>
          No accounts, no tracking cookies, and no download history kept by us. The links you paste are used only to
          fetch the video you asked for.
        </p>
      </section>
      <section>
        <h2>What we process</h2>
        <ul>
          <li><strong>Links you paste:</strong> sent to our server to look up and download the video, then discarded. We don&apos;t keep a list of what you download.</li>
          <li><strong>Technical data:</strong> like any website, our hosting provider records basic request logs (such as IP address, time and requested page) for security and abuse prevention. These are kept for a limited time.</li>
          <li><strong>Downloaded files:</strong> streamed straight to your device; nothing is stored on our servers.</li>
        </ul>
      </section>
      <section>
        <h2>Cookies and local storage</h2>
        <p>
          {SITE.name} doesn&apos;t set tracking or advertising cookies. If you install the app, your browser stores the
          app&apos;s files on your device so it opens quickly.
        </p>
      </section>
      <section>
        <h2>Third parties</h2>
        <ul>
          <li><strong>Platforms:</strong> to fetch a video, our server contacts the platform it&apos;s on (for example TikTok). Watching a TikTok preview loads TikTok&apos;s official player, which is covered by TikTok&apos;s privacy policy.</li>
          <li><strong>Hosting:</strong> the site runs on Vercel, which processes requests on our behalf.</li>
        </ul>
        <p className="mt-3">We don&apos;t sell or share personal data.</p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          Because we don&apos;t keep accounts or download history, there&apos;s usually no personal data of yours for us
          to access or delete. For any privacy question or request, email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </section>
      <section>
        <h2>Children</h2>
        <p>{SITE.name} isn&apos;t directed at children under 13, and we don&apos;t knowingly collect their data.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>We&apos;ll update this page if our practices change; the date above shows the latest version.</p>
      </section>
    </LegalPage>
  );
}
