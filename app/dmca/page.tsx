import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Copyright & DMCA Policy",
  description: `How to report copyright infringement to ${SITE.name}.`,
  alternates: { canonical: "/dmca" },
};

export default function Dmca() {
  return (
    <LegalPage title="Copyright & DMCA Policy" updated="October 8, 2026">
      <section>
        <h2>We don&apos;t host content</h2>
        <p>
          {SITE.name} doesn&apos;t store, host or index any videos or audio. Files are streamed directly from the
          original platform when a user requests them. To have content removed from the internet, contact the platform
          where it&apos;s published; removing it there also makes it unavailable through {SITE.name}.
        </p>
      </section>
      <section>
        <h2>Reporting infringement</h2>
        <p>
          We respect intellectual property rights. If you believe {SITE.name} is being used to infringe your copyright,
          email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> with:
        </p>
        <ul className="mt-3">
          <li>Your name and contact details.</li>
          <li>The copyrighted work you believe is being infringed.</li>
          <li>The exact link(s) to the content on the original platform.</li>
          <li>A statement that you have a good-faith belief the use isn&apos;t authorized by the owner, its agent or the law.</li>
          <li>A statement, under penalty of perjury, that the information is accurate and that you are the owner or authorized to act for the owner.</li>
          <li>Your physical or electronic signature.</li>
        </ul>
      </section>
      <section>
        <h2>What we do</h2>
        <p>
          On receiving a valid notice, we will block the reported links from being processed by {SITE.name} and may
          restrict access for users who repeatedly misuse the service.
        </p>
      </section>
    </LegalPage>
  );
}
