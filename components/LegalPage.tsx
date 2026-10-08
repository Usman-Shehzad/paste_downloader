import type { ReactNode } from "react";
import Footer from "@/components/sections/Footer";
import Navbar from "@/components/sections/Navbar";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
        <div className="mt-10 space-y-8 leading-relaxed text-muted [&_a]:text-accent [&_a]:underline [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
