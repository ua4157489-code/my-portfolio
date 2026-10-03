"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "01<>/{}[]#$%";

type Particle = { x: number; y: number; life: number; ch: string };

export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const ringInner = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.documentElement.classList.add("has-custom-cursor");

    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let gx = mx;
    let gy = my;
    let hovering = false;
    let pressed = false;
    let lastSpawn = 0;
    let visible = false;
    const particles: Particle[] = [];

    const setVisible = (v: boolean) => {
      visible = v;
      const o = v ? "1" : "0";
      if (dot.current) dot.current.style.opacity = o;
      if (ring.current) ring.current.style.opacity = o;
      if (glow.current) glow.current.style.opacity = o;
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      hovering = !!target?.closest("a, button, [role='button']");

      const now = performance.now();
      if (!reduceMotion && now - lastSpawn > 40) {
        lastSpawn = now;
        particles.push({
          x: mx + 8,
          y: my + 8,
          life: 1,
          ch: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        });
      }
    };
    const onDown = () => (pressed = true);
    const onUp = () => (pressed = false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);

      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      gx += (mx - gx) * 0.08;
      gy += (my - gy) * 0.08;

      if (dot.current) dot.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      if (glow.current) glow.current.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      if (ringInner.current) {
        const scale = pressed ? 0.7 : hovering ? 1.8 : 1;
        ringInner.current.style.transform = `scale(${scale})`;
        ringInner.current.style.backgroundColor = hovering
          ? "rgba(0, 255, 156, 0.12)"
          : "transparent";
      }

      ctx.clearRect(0, 0, c.width, c.height);
      ctx.font = "14px monospace";
      ctx.fillStyle = "#00ff9c";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.02;
        p.y += 0.6;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillText(p.ch, p.x, p.y);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  return (
    <>
      <div
        ref={glow}
        style={{ opacity: 0 }}
        className="pointer-events-none fixed left-0 top-0 z-[54] -ml-[150px] -mt-[150px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.12),transparent_60%)] transition-opacity duration-300"
      />
      <canvas
        ref={canvas}
        className="pointer-events-none fixed inset-0 z-[110]"
      />
      <div
        ref={ring}
        style={{ opacity: 0 }}
        className="pointer-events-none fixed left-0 top-0 z-[110] -ml-5 -mt-5 h-10 w-10 transition-opacity duration-300"
      >
        <div
          ref={ringInner}
          className="h-full w-full rounded-full border border-green-400 shadow-[0_0_12px_rgba(0,255,156,0.6)] transition duration-200"
        />
      </div>
      <div
        ref={dot}
        style={{ opacity: 0 }}
        className="pointer-events-none fixed left-0 top-0 z-[110] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#00ff9c] transition-opacity duration-300"
      />
    </>
  );
}
