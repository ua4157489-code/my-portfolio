"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";

function Word({
  word,
  range,
  progress,
  hot,
}: {
  word: string;
  range: [number, number];
  progress: MotionValue<number>;
  hot: boolean;
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <span className="mr-[0.28em] inline-block">
      <motion.span style={{ opacity }} className={"sw-word " + (hot ? "text-acc-1" : "text-white")}>
        {word}
      </motion.span>
    </span>
  );
}

const clean = (w: string) => w.replace(/[.,;:!?]/g, "");

export default function ScrollWords({
  text,
  keywords = [],
  className = "",
}: {
  text: string;
  keywords?: string[];
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const words = text.split(" ");

  // mark every word that belongs to one of the key phrases
  const hot = new Set<number>();
  for (const k of keywords) {
    const kw = k.split(" ");
    for (let i = 0; i <= words.length - kw.length; i++) {
      if (kw.every((w, j) => clean(words[i + j]) === w)) {
        kw.forEach((_, j) => hot.add(i + j));
      }
    }
  }

  return (
    <p ref={ref} aria-label={text} className={className}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word
            key={i}
            word={w}
            range={[start, end]}
            progress={scrollYProgress}
            hot={hot.has(i)}
          />
        );
      })}
    </p>
  );
}
