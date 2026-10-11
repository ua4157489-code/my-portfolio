"use client";

import { useEffect } from "react";

// makes the glow on every .tile follow the mouse, and tilts the smaller tiles in 3D
export default function Spotlight() {
  useEffect(() => {
    let active: HTMLElement | null = null;

    const reset = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };

    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(".tile") as HTMLElement | null;
      if (active && active !== el) reset(active);
      active = el;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.style.setProperty("--mx", x + "px");
      el.style.setProperty("--my", y + "px");

      if (r.width < 700) {
        el.style.setProperty("--ry", (x / r.width - 0.5) * 8 + "deg");
        el.style.setProperty("--rx", -(y / r.height - 0.5) * 8 + "deg");
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
