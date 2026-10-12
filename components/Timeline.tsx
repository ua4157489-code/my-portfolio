"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useInView, useScroll, useSpring } from "framer-motion";

/* Wraps a list of <TimelineItem>. The line fills as you scroll through it. */
export function Timeline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 60%", "end 60%"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.001 });

  return (
    <div ref={ref} className="relative pl-10 md:pl-14">
      <div className="absolute bottom-0 left-3 top-0 w-0.5 bg-white/10 md:left-5" />
      <motion.div
        style={{
          scaleY,
          background: "linear-gradient(to bottom, var(--accent), #22d3ee)",
          boxShadow: "0 0 14px var(--accent)",
        }}
        className="absolute bottom-0 left-3 top-0 w-0.5 origin-top md:left-5"
      />
      {children}
    </div>
  );
}

/* One entry. Its dot lights up when the entry reaches the middle of the screen. */
export function TimelineItem({ children, label }: { children: ReactNode; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, margin: "0px 0px -50% 0px" });

  return (
    <div ref={ref} className="relative pb-14 last:pb-0">
      <span
        aria-hidden
        className={`absolute -left-[34px] top-7 h-3.5 w-3.5 rounded-full border-2 transition-all duration-500 md:-left-[42px] ${
          on
            ? "scale-125 border-white bg-[var(--accent)] shadow-[0_0_20px_var(--accent)]"
            : "border-white/25 bg-black"
        }`}
      />
      {on && (
        <span
          aria-hidden
          className="absolute -left-[34px] top-7 h-3.5 w-3.5 animate-ping rounded-full bg-[var(--accent)] opacity-40 md:-left-[42px]"
        />
      )}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={on ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {label && (
          <p className="mb-3 text-sm font-semibold tracking-wide text-[var(--accent)]">{label}</p>
        )}
        {children}
      </motion.div>
    </div>
  );
}
