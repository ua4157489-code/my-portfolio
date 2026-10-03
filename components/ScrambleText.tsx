"use client";

import { useEffect, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01";

export default function ScrambleText({
  text,
  className,
  duration = 1400,
  delay = 0,
}: {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    let raf = 0;
    let start = 0;
    const timeout = setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const p = Math.min((now - start) / duration, 1);
        const reveal = Math.floor(p * text.length);
        setOut(
          text
            .split("")
            .map((c, i) =>
              c === " " || i < reveal
                ? c
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            )
            .join("")
        );
        if (p < 1) raf = requestAnimationFrame(tick);
        else setOut(text);
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [text, duration, delay]);

  return <span className={className}>{out}</span>;
}
