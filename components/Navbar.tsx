"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NAME, CONTACT } from "@/data/content";

// TODO: put your CV in public/resume.pdf, or change this to your resume link
const RESUME_URL = "/resume.pdf";

const LINKS = [
  { id: "about", label: "about" },
  { id: "education", label: "edu" },
  { id: "skills", label: "skills" },
  { id: "projects", label: "projects" },
  { id: "contact", label: "contact" },
];

type Cmd = { label: string; hint: string; run: () => void };

const go = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export default function Navbar() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const handle = NAME.toLowerCase().replace(/\s+/g, "");

  // solid background after scrolling; hide on scroll down, show on scroll up
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y > lastY && y > 120) setHidden(true);
      else if (y < lastY) setHidden(false);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // highlight the section on screen
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

  // Ctrl/Cmd + K opens the command palette, Esc closes it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery("");
        setIndex(0);
        setPalette((p) => !p);
      } else if (e.key === "Escape") {
        setPalette(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands: Cmd[] = useMemo(
    () => [
      { label: "./top", hint: "section", run: () => go("top") },
      ...LINKS.map((l) => ({
        label: `./${l.label}`,
        hint: "section",
        run: () => go(l.id),
      })),
      { label: "github", hint: "open link", run: () => window.open(CONTACT.github, "_blank") },
      ...(CONTACT.linkedin
        ? [{ label: "linkedin", hint: "open link", run: () => window.open(CONTACT.linkedin, "_blank") }]
        : []),
      ...(CONTACT.email
        ? [{ label: "email", hint: "open mail", run: () => (window.location.href = `mailto:${CONTACT.email}`) }]
        : []),
      { label: "resume", hint: "open file", run: () => window.open(RESUME_URL, "_blank") },
    ],
    []
  );

  const results = commands.filter((c) =>
    c.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  const openPalette = () => {
    setQuery("");
    setIndex(0);
    setPalette(true);
    setOpen(false);
  };
  const closePalette = () => setPalette(false);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[index]?.run();
      closePalette();
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-transform duration-300 ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div
          className={`border-b transition-colors duration-300 ${
            scrolled
              ? "border-green-400/15 bg-black/70 backdrop-blur-xl"
              : "border-transparent bg-black/10 backdrop-blur-sm"
          }`}
        >
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 font-mono text-sm">
            {/* logo: terminal prompt */}
            <a href="#top" className="flex items-center gap-1 font-bold">
              <span className="bg-gradient-to-r from-green-300 to-cyan-300 bg-clip-text text-transparent">
                {handle}@sec
              </span>
              <span className="text-purple-400">:~$</span>
              <span className="animate-pulse text-green-300">▌</span>
            </a>

            {/* links with a pill that glides to the active section */}
            <ul className="hidden items-center gap-1 rounded-full border border-green-400/10 bg-white/[0.03] p-1 md:flex">
              {LINKS.map((l, i) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} className="group relative block rounded-full px-4 py-1.5">
                    {active === l.id && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/20 to-cyan-400/20 shadow-[0_0_18px_rgba(0,255,156,0.25)] ring-1 ring-green-400/50"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative">
                      <span className="text-cyan-400/70">0{i + 1}</span>{" "}
                      <span
                        className={
                          active === l.id
                            ? "text-green-100"
                            : "text-slate-400 transition-colors group-hover:text-white"
                        }
                      >
                        ./{l.label}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {/* status, search, resume */}
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs text-green-200 xl:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                open to work
              </span>

              <button
                onClick={openPalette}
                className="hidden items-center gap-2 rounded border border-cyan-400/30 bg-cyan-400/5 px-3 py-1.5 text-xs text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/10 lg:flex"
              >
                <span>Search</span>
                <kbd className="rounded border border-cyan-400/30 px-1.5 text-[10px] text-cyan-300">
                  Ctrl K
                </kbd>
              </button>

              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded bg-gradient-to-r from-green-400 to-cyan-400 px-4 py-1.5 text-xs font-bold text-black shadow-[0_0_18px_rgba(0,255,156,0.4)] transition hover:brightness-110 md:block"
              >
                ./resume
              </a>

              <button
                onClick={() => setOpen(!open)}
                aria-label="Toggle menu"
                aria-expanded={open}
                className="rounded border border-green-400/30 px-2 py-1 text-green-300 md:hidden"
              >
                {open ? "[x]" : "[≡]"}
              </button>
            </div>
          </nav>

          {/* mobile menu */}
          {open && (
            <div className="border-t border-green-400/15 bg-black/90 px-6 py-4 font-mono text-sm md:hidden">
              <p className="mb-3 text-xs text-purple-400">$ ls sections/</p>
              <ul className="space-y-1">
                {LINKS.map((l, i) => (
                  <li key={l.id}>
                    <a
                      href={`#${l.id}`}
                      onClick={() => setOpen(false)}
                      className={`block rounded px-3 py-2 ${
                        active === l.id
                          ? "bg-gradient-to-r from-green-400/15 to-cyan-400/15 text-green-100"
                          : "text-slate-300"
                      }`}
                    >
                      <span className="text-cyan-400/70">0{i + 1}</span> ./{l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-3">
                <a
                  href={RESUME_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded bg-gradient-to-r from-green-400 to-cyan-400 px-3 py-2 text-center text-xs font-bold text-black"
                >
                  ./resume
                </a>
                <button
                  onClick={openPalette}
                  className="flex-1 rounded border border-cyan-400/40 px-3 py-2 text-xs text-cyan-200"
                >
                  Search
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* command palette (Ctrl + K) */}
      <AnimatePresence>
        {palette && (
          <motion.div
            key="palette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePalette}
            className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[16vh] backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: -12, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -12, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-xl border border-green-400/30 bg-black/90 font-mono shadow-[0_0_60px_rgba(0,255,156,0.15)]"
            >
              <div className="flex items-center gap-3 border-b border-green-400/20 px-4 py-3">
                <span className="text-green-400">&gt;</span>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIndex(0);
                  }}
                  onKeyDown={onInputKey}
                  placeholder="Jump to a section or open a link..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
                <kbd className="rounded border border-slate-600 px-1.5 text-[10px] text-slate-400">
                  esc
                </kbd>
              </div>
              <ul className="max-h-72 overflow-y-auto p-2">
                {results.length === 0 && (
                  <li className="px-3 py-6 text-center text-xs text-slate-500">No match</li>
                )}
                {results.map((c, i) => (
                  <li key={c.label}>
                    <button
                      onClick={() => {
                        c.run();
                        closePalette();
                      }}
                      onMouseEnter={() => setIndex(i)}
                      className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm ${
                        i === index
                          ? "bg-gradient-to-r from-green-400/15 to-cyan-400/15 text-green-100"
                          : "text-slate-300"
                      }`}
                    >
                      <span>{c.label}</span>
                      <span className="text-xs text-cyan-400/70">{c.hint}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
