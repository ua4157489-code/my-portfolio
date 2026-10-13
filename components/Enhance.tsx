"use client";

import { useEffect, useRef } from "react";

export default function Enhance() {
  const bar = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const rain = useRef<HTMLCanvasElement>(null);

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

    // data-stream rain
    const c = rain.current!;
    const ctx = c.getContext("2d")!;
    const size = 16;
    const chars = "01{}[]<>/\\$#%&*+=ABCDEF";
    let w = 0, h = 0, drops: number[] = [], raf = 0, last = 0;

    const resize = () => {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
      drops = Array.from({ length: Math.floor(w / size) }, () => (Math.random() * h) / size);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 70 || document.hidden) return;
      last = t;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.font = `${size}px monospace`;
      ctx.fillStyle = "#22d3ee";
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * size, drops[i] * size);
        if (drops[i] * size > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    if (!reduce) raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={rain}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.13]"
      />
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
