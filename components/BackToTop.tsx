"use client";

import { useEffect, useState } from "react";

const C = 2 * Math.PI * 20;

export default function BackToTop() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`fixed bottom-6 right-20 z-[65] flex h-12 w-12 items-center justify-center font-mono text-green-300 transition ${
        p > 0.05 ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r="20" fill="rgba(0,0,0,0.8)" stroke="rgba(0,255,156,0.2)" strokeWidth="2" />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="#00ff9c"
          strokeWidth="2"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - p)}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative">↑</span>
    </button>
  );
}
