"use client";

import { useEffect, useRef, useState } from "react";

const KONAMI = [
  "arrowup", "arrowup", "arrowdown", "arrowdown",
  "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a",
];

// press g, then one of these letters, to jump to a section
const KEYMAP: Record<string, string> = {
  t: "top",
  a: "about",
  x: "experience",
  e: "education",
  s: "skills",
  p: "projects",
  c: "contact",
};

export default function FX() {
  const warp = useRef<HTMLDivElement>(null);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    // 1. scroll speed as a CSS variable (used for the skew on the skills ticker)
    let last = window.scrollY;
    let vel = 0;
    let raf = 0;
    const loop = () => {
      const y = window.scrollY;
      const v = Math.max(-1, Math.min(1, (y - last) / 60));
      last = y;
      vel += (v - vel) * 0.12;
      document.documentElement.style.setProperty("--vel", vel.toFixed(3));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // 2. a short "warp" flash whenever you jump to a section
    const jump = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const w = warp.current;
      if (w) {
        w.classList.remove("warp-on");
        void w.offsetWidth; // restart the animation
        w.classList.add("warp-on");
      }
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      if (!a) return;
      const id = (a.getAttribute("href") || "").slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      jump(id);
    };

    // 3. keyboard: g + letter jumps, and the Konami code unlocks a surprise
    let armedAt = 0;
    let buffer: string[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();

      buffer = [...buffer, key].slice(-KONAMI.length);
      if (buffer.join(",") === KONAMI.join(",")) {
        setGranted(true);
        clearTimeout(timer);
        timer = setTimeout(() => setGranted(false), 3500);
        buffer = [];
        return;
      }

      const now = Date.now();
      if (key === "g") {
        armedAt = now;
        return;
      }
      if (armedAt && now - armedAt < 1200 && KEYMAP[key]) {
        armedAt = 0;
        jump(KEYMAP[key]);
      }
    };

    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      document.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      <div ref={warp} className="warp pointer-events-none fixed inset-0 z-[90]" />
      {granted && (
        <div className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="rounded-2xl border border-acc-1/50 bg-black/80 px-10 py-8 text-center font-mono shadow-[0_0_80px_rgba(34,211,238,0.35)]">
            <p className="text-4xl font-extrabold tracking-wide text-acc-1 md:text-6xl">
              ACCESS GRANTED
            </p>
            <p className="mt-3 text-sm text-slate-300">You found the secret. Welcome in.</p>
          </div>
        </div>
      )}
    </>
  );
}
