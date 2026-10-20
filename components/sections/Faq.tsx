import { FiArrowRight, FiMail, FiMessageCircle } from "react-icons/fi";
import Reveal from "@/components/motion/Reveal";
import type { Faq as FaqItem } from "@/lib/seo";
import { SITE } from "@/lib/site";
import FaqAccordion from "./FaqAccordion";

export const HOME_FAQS: FaqItem[] = [
  {
    q: "Is Paste Cap free?",
    a: "Yes. There's no sign-up, no payment and no limit on how many videos you can download.",
  },
  {
    q: "Which platforms are supported?",
    a: "TikTok, Instagram, Facebook, X (Twitter), Pinterest, Snapchat, Reddit, LinkedIn, Twitch, Dailymotion, SoundCloud, Bluesky, Tumblr, Rumble, Streamable, 9GAG and Imgur. Pick the platform's tab (or open “More”), then paste the link.",
  },
  {
    q: "Where do I find the video link?",
    a: "In the app, tap Share on the video and choose Copy link. In a browser, copy the address from the address bar.",
  },
  {
    q: "Which qualities can I download?",
    a: "Every resolution the platform offers, up to 1080p, 2K and 4K where available, plus audio only. Some files are assembled as they download, so their sizes (marked ~) are estimates.",
  },
  {
    q: "Can I download private videos?",
    a: "No. Only public videos can be downloaded. Private, friends-only or age-restricted videos need a login and aren't supported.",
  },
  {
    q: "Where are downloaded files saved?",
    a: "In your browser's default downloads folder. On iPhone, open the Files app and look under Downloads.",
  },
  {
    q: "Is downloading videos legal?",
    a: "Download only content you own or have permission to use. Respect each platform's terms of service and creators' copyrights.",
  },
];

export default function Faq({
  items = HOME_FAQS,
  title = "Frequently asked questions",
}: {
  items?: FaqItem[];
  title?: string;
}) {
  return (
    <section id="faq" className="scroll-mt-20 py-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        {/* Heading and contact card stay in view while the questions scroll. */}
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-gradient text-sm font-semibold uppercase tracking-widest">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-md text-muted">
            Quick answers about downloading, quality, MP3 and privacy. Tap a question to open it.
          </p>

          <div className="spotlight relative mt-8 overflow-hidden rounded-3xl border border-border bg-surface p-6">
            <div className="bg-gradient-accent pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20 blur-3xl" aria-hidden />
            <span className="bg-gradient-accent grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg shadow-accent/25">
              <FiMessageCircle size={20} />
            </span>
            <h3 className="mt-4 font-semibold">Still have questions?</h3>
            <p className="mt-1 text-sm text-muted">
              Can&apos;t find what you&apos;re looking for? Send us a message and we&apos;ll get back to you.
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="group/mail mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold transition hover:border-accent/50"
            >
              <FiMail /> Contact us
              <FiArrowRight className="transition-transform group-hover/mail:translate-x-1" />
            </a>
          </div>
        </Reveal>

        <FaqAccordion items={items} />
      </div>
    </section>
  );
}
