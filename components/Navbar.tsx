"use client";

import { useEffect, useState } from "react";
import { NAME } from "@/data/content";

const LINKS = [
  { id: "about", label: "about" },
  { id: "education", label: "education" },
  { id: "skills", label: "skills" },
  { id: "projects", label: "projects" },
  { id: "contact", label: "contact" },
];

export default function Navbar() {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState("");

  const handle = NAME.toLowerCase().replace(/\s+/g, "");

  // solid background once you scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // live UTC clock
  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // highlight the section currently on screen
  useEffect(() => {
    const ids = ["top", ...LINKS.map((l) => l.id)];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id === "top" ? "" : e.target.id);
        }),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-green-900/70 bg-black/80 backdrop-blur-md"
          : "border-transparent bg-black/20 backdrop-blur-sm"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 font-mono text-sm">
        {/* terminal prompt as the logo */}
        <a href="#top" className="flex items-center gap-1 font-bold text-green-400">
          <span className="glow">{handle}@sec</span>
          <span className="text-green-700">:~$</span>
          <span className="animate-pulse">▌</span>
        </a>

        {/* desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l, i) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                className={`rounded px-3 py-1.5 transition ${
                  active === l.id
                    ? "bg-green-400/10 text-green-300 shadow-[inset_0_0_0_1px_rgba(0,255,156,0.4)]"
                    : "text-green-600 hover:text-green-300"
                }`}
              >
                <span className="text-green-800">0{i + 1}.</span> ./{l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* status + call to action */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 text-xs xl:flex">
            <span className="flex items-center gap-2 text-green-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              SECURE
            </span>
            <span className="tabular-nums text-green-700">
              UTC {time || "--:--:--"}
            </span>
          </div>

          <a
            href="#contact"
            className="hidden rounded border border-green-400 px-3 py-1.5 text-green-400 transition hover:bg-green-400 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,156,0.6)] md:block"
          >
            ./hire_me
          </a>

          {/* mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="rounded border border-green-900 px-2 py-1 text-green-400 md:hidden"
          >
            {open ? "[x]" : "[≡]"}
          </button>
        </div>
      </nav>

      {/* mobile dropdown */}
      {open && (
        <div className="border-t border-green-900/70 bg-black/90 px-6 py-4 font-mono text-sm md:hidden">
          <p className="mb-3 text-xs text-green-700">$ ls sections/</p>
          <ul className="space-y-1">
            {LINKS.map((l, i) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  onClick={() => setOpen(false)}
                  className={`block rounded px-3 py-2 ${
                    active === l.id ? "bg-green-400/10 text-green-300" : "text-green-500"
                  }`}
                >
                  <span className="text-green-800">0{i + 1}.</span> ./{l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="mt-2 block rounded border border-green-400 px-3 py-2 text-center text-green-400"
              >
                ./hire_me
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
