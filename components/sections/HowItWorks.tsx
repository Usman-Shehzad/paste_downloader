import { FiClipboard, FiDownload, FiSliders } from "react-icons/fi";
import SectionHeading from "./SectionHeading";
import Reveal from "@/components/motion/Reveal";

const ICONS = [FiClipboard, FiSliders, FiDownload];

export const DEFAULT_STEPS = [
  {
    title: "Copy & paste the link",
    text: "Copy the video URL from the app or browser's Share menu and paste it into the box.",
  },
  {
    title: "Pick a quality",
    text: "Choose a video resolution or audio only. File sizes are shown before you download.",
  },
  {
    title: "Download",
    text: "The file goes straight to your device. Nothing is stored on our servers.",
  },
];

export default function HowItWorks({
  steps = DEFAULT_STEPS,
  title = "Three steps. No sign-up.",
}: {
  steps?: { title: string; text: string }[];
  title?: string;
}) {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-24">
      <SectionHeading eyebrow="How it works" title={title} />
      <Reveal className="group">
      <ol className="relative grid gap-6 md:grid-cols-3">
        <div
          className="bg-gradient-accent absolute left-[16%] right-[16%] top-8 hidden h-px origin-left scale-x-0 opacity-40 transition-transform delay-300 duration-[1400ms] ease-out group-data-[reveal=in]:scale-x-100 md:block"
          aria-hidden
        />
        {steps.map(({ title, text }, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
          <li key={title}>
          <Reveal delay={i * 180} className="relative flex flex-col items-center text-center">
            <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-border bg-surface shadow-lg transition duration-300 hover:-translate-y-1 hover:rotate-3 hover:shadow-xl">
              <Icon size={24} className="text-accent" />
              <span className="bg-gradient-accent absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white">
                {i + 1}
              </span>
            </div>
            <h3 className="mt-5 font-semibold">{title}</h3>
            <p className="mt-2 max-w-xs text-sm text-muted">{text}</p>
          </Reveal>
          </li>
          );
        })}
      </ol>
      </Reveal>
    </section>
  );
}
