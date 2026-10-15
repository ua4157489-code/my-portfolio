"use client";

import { useEffect, useState } from "react";

const DOTS: [string, string][] = [
  ["home-hero", "Intro"],
  ["home-terminal", "Terminal"],
  ["home-skills", "Skills"],
  ["home-projects", "Projects"],
  ["home-github", "GitHub"],
  ["home-journey", "Journey"],
  ["home-explore", "Explore"],
  ["home-contact", "Contact"],
];

// a dot for every part of the Home page: click one to jump there
export default function HomeDots() {
  const [active, setActive] = useState(DOTS[0][0]);

  useEffect(() => {
    const els = DOTS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <nav aria-label="Sections of the home page" className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 xl:flex">
      {DOTS.map(([id, label]) => (
        <button
          key={id}
          onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          aria-label={label}
          aria-current={active === id}
          className="group flex items-center gap-3"
        >
          <span className="rounded bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100">
            {label}
          </span>
          <span
            className={`block rounded-full border transition-all ${
              active === id ? "h-3.5 w-3.5 border-cyan-300 bg-cyan-300 shadow-[0_0_14px_#22d3ee]" : "h-2.5 w-2.5 border-white/40 bg-transparent group-hover:border-white"
            }`}
          />
        </button>
      ))}
    </nav>
  );
}
