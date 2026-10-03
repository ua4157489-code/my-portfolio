"use client";

import { useEffect, useRef } from "react";

const CHARS = "アイウエオカキクケコサシスセソ0123456789ABCDEF<>/{}[]$#";

export default function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const fontSize = 16;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -50);
    };
    resize();
    window.addEventListener("resize", resize);

    let last = 0;
    let raf = 0;
    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      if (time - last < 55) return;
      last = time;

      // fade old characters out so the scene behind stays visible
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = "#00ff9c";
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < columns; i++) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[1] opacity-25"
    />
  );
}
