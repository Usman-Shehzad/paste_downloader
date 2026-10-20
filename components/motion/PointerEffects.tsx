"use client";

import { useEffect } from "react";

const MAX_TILT = 7; // degrees
const MAGNET = 0.25; // fraction of the pointer's offset a magnetic element follows

/**
 * One page-wide pointer listener for the hover effects:
 * - `.spotlight`: glow follows the pointer (--mx/--my)
 * - `.tilt`: 3D tilt toward the pointer (--rx/--ry)
 * - `.magnetic`: the element leans toward the pointer (--tx/--ty)
 */
export default function PointerEffects() {
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let magnet: HTMLElement | null = null;

    const releaseMagnet = () => {
      magnet?.style.setProperty("--tx", "0px");
      magnet?.style.setProperty("--ty", "0px");
      magnet = null;
    };

    const onMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const spot = target?.closest?.<HTMLElement>(".spotlight");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      if (reduced) return;

      const tilt = target?.closest?.<HTMLElement>(".tilt");
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty("--ry", `${(px * MAX_TILT * 2).toFixed(2)}deg`);
        tilt.style.setProperty("--rx", `${(-py * MAX_TILT * 2).toFixed(2)}deg`);
      }

      const mag = target?.closest?.<HTMLElement>(".magnetic") ?? null;
      if (mag !== magnet) releaseMagnet();
      if (mag) {
        magnet = mag;
        const r = mag.getBoundingClientRect();
        mag.style.setProperty("--tx", `${((e.clientX - r.left - r.width / 2) * MAGNET).toFixed(1)}px`);
        mag.style.setProperty("--ty", `${((e.clientY - r.top - r.height / 2) * MAGNET).toFixed(1)}px`);
      }
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", releaseMagnet);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", releaseMagnet);
    };
  }, []);
  return null;
}
