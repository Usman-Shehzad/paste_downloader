"use client";

import { useEffect, useRef, useState } from "react";

const INTERACTIVE = 'a, button, summary, label, select, [role="tab"], [role="menuitemradio"], [role="radio"]';
const TEXT = 'input, textarea, [contenteditable="true"]';

/**
 * A dot that sits on the pointer and a ring that trails it, growing over
 * links and buttons, and a ripple on click. Mouse/trackpad only; off for
 * touch screens and for visitors who prefer reduced motion. The system
 * cursor stays visible.
 */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEnabled(matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches);
  }, []);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!enabled || !dot || !ring) return;

    let x = 0;
    let y = 0;
    let rx = 0;
    let ry = 0;
    let seen = false;
    let raf = 0;

    const tick = () => {
      // The ring eases toward the pointer, so it trails behind it.
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x = e.clientX;
      y = e.clientY;
      if (!seen) {
        seen = true;
        rx = x;
        ry = y;
      }
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      dot.dataset.visible = ring.dataset.visible = "1";
      const t = e.target as Element | null;
      ring.dataset.mode = t?.closest?.(TEXT) ? "text" : t?.closest?.(INTERACTIVE) ? "link" : "";
    };
    const onDown = (e: PointerEvent) => {
      ring.dataset.down = "1";
      const ripple = document.createElement("span");
      ripple.className = "cursor-ripple";
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.addEventListener("animationend", () => ripple.remove());
      document.body.appendChild(ripple);
    };
    const onUp = () => delete ring.dataset.down;
    const onLeave = () => {
      delete dot.dataset.visible;
      delete ring.dataset.visible;
    };

    raf = requestAnimationFrame(tick);
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden>
        <span />
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
}
