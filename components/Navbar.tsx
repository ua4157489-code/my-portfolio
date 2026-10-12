"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NAME, CONTACT } from "@/data/content";
import SocialLinks from "@/components/SocialLinks";

const RESUME_URL = "/resume.pdf";

const LINKS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

export default function Navbar() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [p, setP] = useState(0);

  // scroll progress and solid background
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
      setScrolled(window.scrollY > 30);
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

  // lock page scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const openPalette = () => {
    setMenu(false);
    window.dispatchEvent(new Event("open-palette"));
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
        <nav
          className={`relative mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border px-4 py-2.5 transition-all duration-300 sm:px-6 ${
            scrolled
              ? "border-acc-1/25 bg-black/70 shadow-[0_8px_40px_rgba(34,211,238,0.12)] backdrop-blur-xl"
              : "border-white/10 bg-black/35 backdrop-blur-md"
          }`}
        >
          {/* logo */}
          <a href="#top" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-acc-1/40 bg-acc-1/10 text-acc-1 shadow-[0_0_18px_rgba(34,211,238,0.35)] transition group-hover:scale-110">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold tracking-wide text-white">
                {NAME}
              </span>
              <span className="block text-[11px] text-acc-1">Cyber security</span>
            </span>
          </a>

          {/* links */}
          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  className="relative block rounded-lg px-3.5 py-2 text-[13px] font-medium"
                >
                  {active === l.id && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-acc-1/10 ring-1 ring-acc-1/40"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative transition-colors ${
                      active === l.id ? "text-white" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {/* actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={openPalette}
              className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:border-acc-1/50 hover:text-white md:flex"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              Search
              <kbd className="rounded border border-white/15 px-1.5 text-[10px] text-slate-400">
                Ctrl K
              </kbd>
            </button>

            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg border border-acc-2/40 px-3.5 py-2 text-xs font-semibold text-acc-2 transition hover:bg-acc-2/10 xl:block"
            >
              Resume
            </a>

            <button
              onClick={() => setMenu(!menu)}
              aria-label="Toggle menu"
              aria-expanded={menu}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white lg:hidden"
            >
              {menu ? "✕" : "☰"}
            </button>
          </div>

          {/* scroll progress */}
          <span className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-white/10">
            <span
              className="block h-full origin-left bg-gradient-to-r from-acc-1 via-acc-2 to-acc-3"
              style={{ transform: `scaleX(${p})` }}
            />
          </span>
        </nav>
      </header>

      {/* mobile menu */}
      <AnimatePresence>
        {menu && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-black/95 px-8 pb-10 pt-28 backdrop-blur-xl lg:hidden"
          >
            <ul className="space-y-1">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <a
                    href={`#${l.id}`}
                    onClick={() => setMenu(false)}
                    className={`flex items-baseline gap-4 border-b border-white/10 py-4 text-3xl font-bold ${
                      active === l.id ? "text-acc-1" : "text-white"
                    }`}
                  >
                    <span className="text-sm font-normal text-slate-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-gradient-to-r from-acc-1 to-acc-2 px-5 py-3 text-sm font-extrabold text-black"
              >
                Download resume
              </a>
              <button
                onClick={openPalette}
                className="rounded-lg border border-white/20 px-5 py-3 text-sm text-white"
              >
                Search
              </button>
            </div>

            <SocialLinks className="mt-8" />
            {CONTACT.email && (
              <p className="mt-6 text-sm text-slate-400">{CONTACT.email}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
