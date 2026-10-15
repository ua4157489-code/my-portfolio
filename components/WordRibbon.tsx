"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { SKILL_GROUPS } from "@/data/skills";

// a big line of words that drifts on its own and speeds up (or reverses) with your scroll speed
function Row({ words, base, outline }: { words: string[]; base: number; outline: boolean }) {
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const vel = useVelocity(scrollY);
  const smooth = useSpring(vel, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [-1500, 0, 1500], [-2, 0, 2]);
  const dir = useRef(base < 0 ? -1 : 1);

  useAnimationFrame((_, delta) => {
    const calm = document.documentElement.dataset.motion === "calm";
    const f = factor.get();
    if (f < -0.01) dir.current = -1;
    else if (f > 0.01) dir.current = 1;
    const move = calm ? 0 : Math.abs(base) * (delta / 1000) * (1 + Math.abs(f));
    const v = x.get() - dir.current * move;
    x.set(-(((-v % 50) + 50) % 50));
  });

  const tx = useTransform(x, (v) => `${v}%`);
  const list = [...words, ...words, ...words, ...words];

  return (
    <div className="overflow-hidden whitespace-nowrap py-2">
      <motion.div style={{ x: tx }} className="inline-flex">
        {list.map((w, i) => (
          <span
            key={i}
            className={`mx-6 text-5xl font-black uppercase tracking-tight md:text-7xl ${
              outline ? "stroke-text" : "text-white/90"
            }`}
          >
            {w}
            <span className="mx-6 text-cyan-300">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function WordRibbon() {
  const names = SKILL_GROUPS.map((g) => g.group);
  const half = Math.ceil(names.length / 2);
  return (
    <section aria-hidden="true" className="relative z-10 overflow-hidden border-y border-white/10 bg-black/40 py-10 backdrop-blur-sm">
      <Row words={names.slice(0, half)} base={0.8} outline />
      <Row words={names.slice(half).length ? names.slice(half) : names} base={-0.8} outline={false} />
    </section>
  );
}
