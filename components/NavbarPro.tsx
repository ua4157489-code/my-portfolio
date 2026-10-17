"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { NAME } from "@/data/content";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/education", label: "Education" },
  { href: "/skills", label: "Skills" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70";

function openPalette() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
}

export default function NavbarPro() {
  const path = usePathname();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth >= 768 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const isActive = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <div className="relative mx-auto max-w-5xl">
          <div
            aria-hidden
            className={`absolute -inset-px -z-10 rounded-2xl bg-gradient-to-r from-cyan-400/40 via-violet-500/40 to-pink-500/40 blur-md transition-opacity duration-500 ${
              scrolled ? "opacity-40" : "opacity-15"
            }`}
          />
          <nav
            aria-label="Primary"
            className={`relative flex items-center justify-between overflow-hidden rounded-2xl border font-mono text-sm backdrop-blur-xl transition-all duration-300 ${
              scrolled
                ? "border-cyan-400/25 bg-black/75 px-3 py-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
                : "border-white/10 bg-black/40 px-4 py-3"
            }`}
          >
            {/* logo */}
            <Link href="/" className={`group flex items-center gap-3 rounded-lg ${focus}`} aria-label="Home">
              <span className="relative grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 transition group-hover:shadow-[0_0_18px_rgba(34,211,238,0.5)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <span className="leading-tight">
                <span className="block whitespace-nowrap font-bold text-white">{NAME}</span>
                <span className={`block whitespace-nowrap text-[11px] text-cyan-300/80 transition-all ${scrolled ? "hidden sm:block" : ""}`}>Cyber security</span>
              </span>
            </Link>

            {/* desktop links */}
            <ul className="hidden items-center gap-1 md:flex">
              {LINKS.map((l) => {
                const a = isActive(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={a ? "page" : undefined}
                      className={`relative block rounded-lg px-3.5 py-2 transition-colors ${focus} ${
                        a ? "text-white" : "text-slate-400 hover:text-cyan-200"
                      }`}
                    >
                      {a && (
                        <motion.span
                          layoutId="nav-pill"
                          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                          className="absolute inset-0 rounded-lg border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.18)]"
                        />
                      )}
                      <span className="relative">{l.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* right side */}
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 whitespace-nowrap pr-2 text-xs text-emerald-300/90 min-[2200px]:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                open to work
              </span>

              <button
                onClick={openPalette}
                aria-label="Open search"
                className={`flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-200 ${focus}`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <span className="hidden xl:inline">Search</span>
                <kbd className="hidden whitespace-nowrap rounded border border-white/10 px-1.5 text-[10px] text-slate-500 lg:inline">Ctrl K</kbd>
              </button>

              <a
                href="/resume.pdf"
                download
                className={`hidden whitespace-nowrap rounded-lg bg-gradient-to-r from-cyan-400 to-violet-400 px-4 py-2 text-xs font-bold text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] transition hover:shadow-[0_0_30px_rgba(167,139,250,0.55)] md:block ${focus}`}
              >
                Resume ↓
              </a>

              <button
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                className={`flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg border border-white/10 text-cyan-300 md:hidden ${focus}`}
              >
                <span className={`h-0.5 w-5 bg-current transition-all duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
                <span className={`h-0.5 w-5 bg-current transition-all duration-300 ${open ? "opacity-0" : ""}`} />
                <span className={`h-0.5 w-5 bg-current transition-all duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
              </button>
            </div>

            {/* scroll progress */}
            <motion.div
              aria-hidden
              style={{ scaleX: progress }}
              className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-500"
            />
          </nav>
        </div>
      </header>

      {/* mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-black/90 px-8 font-mono backdrop-blur-xl md:hidden"
          >
            <p className="mb-5 text-xs tracking-widest text-cyan-400/70">$ ls pages/</p>
            <ul className="space-y-1">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: reduce ? 0 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduce ? 0 : 0.05 + i * 0.05 }}
                >
                  <Link
                    href={l.href}
                    className={`flex items-baseline gap-3 rounded-lg py-2 text-3xl font-bold ${
                      isActive(l.href) ? "text-cyan-300" : "text-slate-200"
                    }`}
                  >
                    <span className="text-xs font-normal text-cyan-700">0{i + 1}</span>
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <a href="/resume.pdf" download className="mt-8 w-fit rounded-lg bg-gradient-to-r from-cyan-400 to-violet-400 px-5 py-3 text-sm font-bold text-black">
              Download resume ↓
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
