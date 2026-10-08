import { FiChevronDown } from "react-icons/fi";
import type { Faq as FaqItem } from "@/lib/seo";
import SectionHeading from "./SectionHeading";

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
      <SectionHeading eyebrow="FAQ" title={title} />
      <div className="mx-auto max-w-3xl space-y-3">
        {items.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-2xl border border-border bg-surface px-5 transition open:bg-surface-2"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <FiChevronDown className="shrink-0 text-muted transition group-open:rotate-180" />
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
