"use client";

import { useEffect, useMemo, useRef } from "react";
import type { MouseEvent as RMouseEvent, PointerEvent as RPointerEvent } from "react";
import Link from "next/link";
import { Section, Heading } from "@/components/HomeKit";
import { FLAT, SKILL_GROUPS } from "@/data/skills";
import { accentOf } from "@/components/skillColors";

// every skill floats on a sphere you can spin with the mouse
export default function SkillSphere() {
  const items = useMemo(
    () =>
      FLAT.map((s, i) => {
        const k = i + 0.5;
        const phi = Math.acos(1 - (2 * k) / FLAT.length);
        const th = Math.PI * (1 + Math.sqrt(5)) * k;
        return {
          name: s.name,
          color: accentOf(s.group),
          p: [Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)] as const,
        };
      }),
    []
  );

  const box = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLAnchorElement | null)[]>([]);
  const st = useRef({ rx: 0.3, ry: 0, vx: 0, vy: 0.004, drag: false, hover: false, lx: 0, ly: 0, moved: 0 });

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = box.current;
      if (el) {
        const s = st.current;
        const calm = document.documentElement.dataset.motion === "calm";
        const R = el.clientWidth * 0.4;
        if (!s.drag) {
          s.vy += ((calm || s.hover ? 0 : 0.004) - s.vy) * 0.05;
          s.vx *= 0.94;
        }
        s.ry += s.vy;
        s.rx = Math.max(-1.2, Math.min(1.2, s.rx + s.vx));
        const cy = Math.cos(s.ry);
        const sy = Math.sin(s.ry);
        const cx = Math.cos(s.rx);
        const sx = Math.sin(s.rx);
        items.forEach((it, i) => {
          const node = els.current[i];
          if (!node) return;
          const x1 = it.p[0] * cy + it.p[2] * sy;
          const z1 = -it.p[0] * sy + it.p[2] * cy;
          const y2 = it.p[1] * cx - z1 * sx;
          const z2 = it.p[1] * sx + z1 * cx;
          const depth = (z2 + 1) / 2;
          node.style.transform = `translate(-50%, -50%) translate3d(${x1 * R}px, ${y2 * R}px, 0) scale(${0.6 + depth * 0.6})`;
          node.style.opacity = String(0.2 + depth * 0.8);
          node.style.zIndex = String(Math.round(depth * 100));
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [items]);

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    s.drag = true;
    s.moved = 0;
    s.lx = e.clientX;
    s.ly = e.clientY;
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (!s.drag) return;
    const dx = e.clientX - s.lx;
    const dy = e.clientY - s.ly;
    s.lx = e.clientX;
    s.ly = e.clientY;
    s.moved += Math.abs(dx) + Math.abs(dy);
    s.ry += dx * 0.006;
    s.rx = Math.max(-1.2, Math.min(1.2, s.rx - dy * 0.006));
    s.vy = dx * 0.006;
    s.vx = -dy * 0.002;
  };
  const up = () => {
    st.current.drag = false;
  };
  const clickCapture = (e: RMouseEvent<HTMLDivElement>) => {
    if (st.current.moved > 6) {
      e.preventDefault();
      e.stopPropagation();
      st.current.moved = 0;
    }
  };

  return (
    <Section id="home-skills" side="left">
      <Heading
        kicker="What I work with"
        title="My skills, in orbit"
        text={`${FLAT.length} skills across ${SKILL_GROUPS.length} categories. Drag to spin the sphere, click any skill to explore them all.`}
      />
      <div
        ref={box}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={() => {
          up();
          st.current.hover = false;
        }}
        onPointerEnter={() => (st.current.hover = true)}
        onClickCapture={clickCapture}
        className="relative mx-auto mt-6 aspect-square w-full max-w-[540px] cursor-grab select-none active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
      >
        <div className="pointer-events-none absolute inset-[14%] rounded-full border border-cyan-300/10 bg-[radial-gradient(circle,rgba(34,211,238,0.08),transparent_70%)]" />
        {items.map((it, i) => (
          <Link
            key={it.name}
            href="/skills"
            draggable={false}
            ref={(n) => {
              els.current[i] = n;
            }}
            style={{ color: it.color, opacity: 0 }}
            className="absolute left-1/2 top-1/2 whitespace-nowrap rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-semibold backdrop-blur-sm will-change-transform"
          >
            {it.name}
          </Link>
        ))}
      </div>
    </Section>
  );
}
