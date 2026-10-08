import { FiGift, FiLock, FiMusic, FiSmartphone, FiZap, FiMonitor } from "react-icons/fi";
import SectionHeading from "./SectionHeading";

const FEATURES = [
  { icon: FiZap, title: "Fast streaming", text: "Files stream straight to you without waiting for a server-side copy." },
  { icon: FiMonitor, title: "Quality options", text: "Pick the resolution you need, from small mobile files to HD." },
  { icon: FiMusic, title: "Audio only", text: "Save just the sound track as M4A or MP3 when available." },
  { icon: FiLock, title: "Private", text: "No accounts, no history, and no files kept on our servers." },
  { icon: FiSmartphone, title: "Works everywhere", text: "Built for phones, tablets and desktops, with no app to install." },
  { icon: FiGift, title: "Free", text: "No limits on the number of videos and no watermarks added by us." },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-24">
      <SectionHeading
        eyebrow="Features"
        title="Everything you need, nothing you don't"
      />
      <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-surface p-7 transition hover:bg-surface-2">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
              <Icon size={20} />
            </div>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
