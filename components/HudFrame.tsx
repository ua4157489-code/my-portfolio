"use client";

import { useEffect, useState } from "react";

const ITEMS = [
  { id: "top", label: "HERO" },
  { id: "about", label: "ABOUT" },
  { id: "education", label: "EDU" },
  { id: "skills", label: "SKILLS" },
  { id: "projects", label: "PROJECTS" },
  { id: "contact", label: "CONTACT" },
];

export default function HudFrame() {
  const [p, setP] = useState(0);
  const [active, setActive] = useState("top");

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = ITEMS.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const current = ITEMS.find((i) => i.id === active)?.label ?? "HERO";

  return (
    <div className="pointer-events-none fixed inset-0 z-[52] font-mono">
      {/* left section rail (wide screens only) */}
      <div className="absolute left-5 top-1/2 hidden -translate-y-1/2 xl:block">
        <div className="relative flex flex-col gap-6 pl-5">
          <span className="absolute bottom-1 left-[5px] top-1 w-px bg-green-900" />
          <span
            className="absolute left-[5px] top-1 w-px bg-green-400 shadow-[0_0_8px_#00ff9c]"
            style={{ height: `calc(${p * 100}% - 0.5rem)` }}
          />
          {ITEMS.map((i) => (
            <button
              key={i.id}
              onClick={() => go(i.id)}
              aria-label={i.label}
              className="group pointer-events-auto relative flex items-center text-left"
            >
              <span
                className={`absolute -left-5 h-[11px] w-[11px] rounded-full border transition ${
                  active === i.id
                    ? "scale-125 border-green-400 bg-green-400 shadow-[0_0_10px_#00ff9c]"
                    : "border-green-800 bg-black group-hover:border-green-400"
                }`}
              />
              <span
                className={`text-[10px] tracking-[0.25em] transition ${
                  active === i.id ? "text-green-300" : "text-transparent group-hover:text-green-600"
                }`}
              >
                {i.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* bottom-left readout */}
      <div className="absolute bottom-4 left-24 hidden text-[10px] tracking-[0.25em] text-green-700 md:block">
        SCROLL {String(Math.round(p * 100)).padStart(3, "0")}% · {current}
      </div>
    </div>
  );
}
