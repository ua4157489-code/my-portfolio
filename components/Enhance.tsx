"use client";

import { useEffect, useRef } from "react";

export default function Enhance() {
  const bar = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onMove = (e: PointerEvent) => {
      if (glow.current)
        glow.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });


    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <>
      <div
        ref={glow}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-0 hidden h-[400px] w-[400px] rounded-full bg-cyan-400/10 blur-3xl will-change-transform md:block"
      />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
        <div
          ref={bar}
          className="h-full origin-left bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </>
  );
}
