"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const META: Record<string, { label: string; kicker: string; accent: string }> = {
  about: { label: "About", kicker: "Who I am and what I focus on", accent: "#22d3ee" },
  experience: { label: "Experience", kicker: "Where I have worked", accent: "#ff4d9d" },
  education: { label: "Education", kicker: "Where I studied", accent: "#a78bfa" },
  skills: { label: "Skills", kicker: "What I can do", accent: "#fbbf24" },
  projects: { label: "Projects", kicker: "What I have built", accent: "#22d3ee" },
  contact: { label: "Contact", kicker: "Let's talk", accent: "#a78bfa" },
};
const ORDER = Object.keys(META);

export default function SplitSection({ id, children, aside }: { id: string; children: ReactNode; aside?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const ghostY = useTransform(scrollYProgress, [0, 1], [90, -90]);
  const lineScale = useTransform(scrollYProgress, [0.05, 0.4], [0, 1]);

  const meta = META[id] ?? { label: id, kicker: "", accent: "#22d3ee" };
  const n = String(ORDER.indexOf(id) + 1).padStart(2, "0");

  return (
    <section
      ref={ref}
      id={id}
      style={{ "--accent": "var(--user-accent, " + meta.accent + ")" } as CSSProperties}
      className="relative overflow-x-clip border-y border-white/5 bg-black/25"
    >
      {/* accent glow on the left edge: each section has its own colour */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 opacity-25"
        style={{ background: "radial-gradient(ellipse at left, var(--accent), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-28 lg:grid lg:min-h-[85vh] lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
        <aside className="relative mb-10 select-none lg:sticky lg:top-28 lg:mb-0 lg:self-start">
          <motion.span
            style={{ y: ghostY, WebkitTextStroke: "1px var(--accent)" }}
            className="pointer-events-none block text-8xl font-extrabold leading-none text-transparent opacity-45 lg:text-9xl"
          >
            {n}
          </motion.span>
          <motion.h2
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            whileInView={{ clipPath: "inset(0 0% 0 0)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-3 text-4xl font-extrabold tracking-tight text-white lg:text-5xl"
          >
            {meta.label}
          </motion.h2>
          <p className="mt-2 text-sm text-slate-300">{meta.kicker}</p>
          <motion.span
            style={{
              scaleX: lineScale,
              background: "linear-gradient(90deg, var(--accent), transparent)",
            }}
            className="mt-5 block h-0.5 w-28 origin-left"
          />
        {aside && <div className="mt-8">{aside}</div>}
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
