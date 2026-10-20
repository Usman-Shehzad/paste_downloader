import Reveal from "@/components/motion/Reveal";

export default function CallToAction({ text = "Copy a link from any supported platform and paste it in." }) {
  return (
    <Reveal className="pb-24">
      <div className="bg-gradient-accent relative overflow-hidden rounded-3xl px-6 py-14 text-center text-white">
        <div className="bg-grid absolute inset-0 opacity-20" aria-hidden />
        <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">Ready to save a video?</h2>
        <p className="relative mx-auto mt-3 max-w-md text-white/85">{text}</p>
        <a
          href="#download"
          className="shine magnetic relative mt-7 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-black shadow-lg transition hover:scale-105"
        >
          Paste a link now
        </a>
      </div>
    </Reveal>
  );
}
