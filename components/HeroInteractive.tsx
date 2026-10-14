"use client";

import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ScrambleText from "@/components/ScrambleText";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

/** One staggered entrance step. Must sit inside <HeroStage>. */
export function HeroItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}

/** Wraps the hero text: cursor light, 3D tilt, scroll parallax, staggered entrance. */
export function HeroStage({ children }: { children: ReactNode }) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -70]);
  const fade = useTransform(scrollY, [0, 500], [1, 0.15]);
  const lightOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        lightRef.current?.style.setProperty("--hx", `${e.clientX}px`);
        lightRef.current?.style.setProperty("--hy", `${e.clientY}px`);
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        tiltRef.current?.style.setProperty("--rx", `${(-ny * 5).toFixed(2)}deg`);
        tiltRef.current?.style.setProperty("--ry", `${(nx * 7).toFixed(2)}deg`);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <>
      <motion.div
        ref={lightRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          opacity: lightOpacity,
          background:
            "radial-gradient(520px circle at var(--hx,30%) var(--hy,40%), rgba(34,211,238,0.14), transparent 65%)",
        }}
      />
      <motion.div style={{ y, opacity: fade }} className="max-w-4xl">
        <div
          ref={tiltRef}
          style={{
            transform: "perspective(1100px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
            transition: "transform 0.25s ease-out",
            transformOrigin: "left center",
          }}
        >
          <motion.div variants={container} initial="hidden" animate="show">
            {children}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

/** The name: scrambles in on load, and decodes again whenever you hover it. */
export function HeroName({ name, className }: { name: string; className: string }) {
  const [n, setN] = useState(0);
  const last = useRef(0);

  useEffect(() => {
    last.current = Date.now() + 1500; // ignore hovers during the first scramble
  }, []);

  const replay = () => {
    const now = Date.now();
    if (now - last.current < 1800) return;
    last.current = now;
    setN((v) => v + 1);
  };

  return (
    <h1 className={className} data-text={name} onMouseEnter={replay}>
      <ScrambleText key={n} text={name} delay={n === 0 ? 1500 : 0} />
    </h1>
  );
}
