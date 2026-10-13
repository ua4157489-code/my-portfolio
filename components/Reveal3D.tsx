"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export default function Reveal3D({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.3, 0.75, 1], [26, 0, 0, -14]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.75, 1], [90, 0, 0, -50]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.75, 1], [0.92, 1, 1, 0.96]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0, 1, 1, 0.35]);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} style={{ perspective: 1200 }} className={className}>
      <motion.div style={{ rotateX, y, scale, opacity, transformOrigin: "50% 100%" }}>
        {children}
      </motion.div>
    </div>
  );
}
