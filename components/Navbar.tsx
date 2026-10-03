"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { NAME, CONTACT } from "@/data/content";

const LINKS = [
  { id: "about", label: "about" },
  { id: "education", label: "edu" },
  { id: "skills", label: "skills" },
  { id: "projects", label: "projects" },
  { id: "contact", label: "contact" },
];

const focus =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400";

type Item = { label: string; hint: string; run: () => void };

export default function Navbar() {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const [toast, setToast] = useState("");
  const lastY = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  const handle = NAME.toLowerCase().replace(/\s+/g, "");

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  // command palette items
  const items = useMemo<Item[]>(() => {
    const go = (id: string) => () =>
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    const list: Item[] = [
      { label: "top", hint: "go to hero", run: go("top") },
      ...LINKS.map((l) => ({ label: l.id, hint: "go to section", run: go(l.id) })),
      { label: "resume", hint: "open resume.pdf", run: () => window.open("/resume.pdf", "_blank") },
    ];
    if (CONTACT.email) {
      list.push(
        { label: "email", hint: "write me an email", run: () => (window.location.href = `mailto:${CONTACT.email}`) },
        {
          label: "copy email",
          hint: "copy address to clipboard",
          run: async () => {
            try {
              await navigator.clipboard.writeText(CONTACT.email);
              flash("email copied");
            } catch {
              flash("copy failed");
            }
          },
        }
      );
    }
    if (CONTACT.github)
      list.push({ label: "github", hint: "open profile", run: () => window.open(CONTACT.github, "_blank", "noopener") });
    if (CONTACT.linkedin)
      list.push({ label: "linkedin", hint: "open profile", run: () => window.open(CONTACT.linkedin, "_blank", "noopener") });
    return list;
  }, []);

  const filtered = items.filter((i) =>
    `${i.label} ${i.hint}`.toLowerCase().includes(query.toLowerCase())
  );

  const runItem = (item?: Item) => {
    if (!item) return;
    setPalette(false);
    setQuery("");
    item.run();
  };

  // scroll: solid background, hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (!open) {
        if (y > lastY.current && y > 120) setHidden(true);
        else if (y < lastY.current) setHidden(false);
      }
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

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

  // keyboard: Ctrl/Cmd+K toggles palette, Esc closes everything
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
        setQuery("");
        setSel(0);
      } else if (e.key === "Escape") {
        setPalette(false);
        setOpen(false);
      }
    };
    const onResize = () => window.innerWidth >= 768 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // lock body scroll while a menu is open
  useEffect(() => {
    document.body.style.overflow = open || palette ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, palette]);

  useEffect(() => {
    if (palette) inputRef.current?.focus();
  }, [palette]);

  const onPaletteKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      runItem(filtered[sel]);
    }
  };

  const bar = "block h-0.5 w-5 bg-current transition-all duration-300";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          hidden && !open ? "-translate-y-full" : ""
        } ${
          scrolled || open
            ? "border-cyan-900/70 bg-black/80 backdrop-blur-md"
            : "border-transparent bg-black/20 backdrop-blur-sm"
        }`}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 font-mono text-sm"
        >
          <a
            href="#top"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-1 rounded font-bold text-cyan-400 ${focus}`}
          >
            <span className="glow">{handle}@sec</span>
            <span className="text-cyan-700">:~$</span>
            <span className="animate-pulse">▌</span>
          </a>

          {/* desktop links with sliding highlight */}
          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l, i) => {
              const isActive = active === l.id;
              return (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`relative block rounded px-3 py-1.5 transition-colors ${focus} ${
                      isActive ? "text-cyan-300" : "text-cyan-600 hover:text-cyan-300"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={
                          reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
                        }
                        className="absolute inset-0 rounded bg-cyan-400/10 shadow-[inset_0_0_0_1px_rgba(0,200,255,0.4)]"
                      />
                    )}
                    <span className="relative">
                      <span className="text-cyan-800">0{i + 1}.</span> ./{l.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs text-cyan-500 xl:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              open to work
            </span>

            {/* palette button */}
            <button
              onClick={() => {
                setPalette(true);
                setQuery("");
                setSel(0);
              }}
              aria-label="Open command palette"
              className={`flex items-center gap-2 rounded border border-cyan-900 px-2.5 py-1.5 text-xs text-cyan-600 transition hover:border-cyan-400 hover:text-cyan-300 ${focus}`}
            >
              <span aria-hidden>⌕</span>
              <kbd className="hidden text-cyan-800 lg:inline">Ctrl K</kbd>
            </button>

            <a
              href="/resume.pdf"
              download
              className={`hidden rounded border border-cyan-400 px-3 py-1.5 text-cyan-400 transition hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(0,200,255,0.6)] md:block ${focus}`}
            >
              ./resume
            </a>

            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={`flex flex-col gap-1.5 rounded p-2 text-cyan-400 md:hidden ${focus}`}
            >
              <span className={`${bar} ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`${bar} ${open ? "opacity-0" : ""}`} />
              <span className={`${bar} ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>
          </div>
        </nav>

        {/* mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="panel"
              id="mobile-menu"
              initial={{ opacity: 0, y: reduce ? 0 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -8 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              className="border-t border-cyan-900/70 bg-black/95 px-6 py-5 font-mono text-sm md:hidden"
            >
              <p className="mb-3 text-xs text-cyan-700">$ ls sections/</p>
              <ul className="space-y-1">
                {LINKS.map((l, i) => (
                  <li key={l.id}>
                    <a
                      href={`#${l.id}`}
                      onClick={() => setOpen(false)}
                      aria-current={active === l.id ? "true" : undefined}
                      className={`block rounded px-3 py-2.5 ${focus} ${
                        active === l.id ? "bg-cyan-400/10 text-cyan-300" : "text-cyan-500"
                      }`}
                    >
                      <span className="text-cyan-800">0{i + 1}.</span> ./{l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href="/resume.pdf"
                download
                onClick={() => setOpen(false)}
                className={`mt-4 block rounded border border-cyan-400 px-3 py-2.5 text-center text-cyan-400 ${focus}`}
              >
                ./resume
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* tap-to-close backdrop for the mobile menu */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          aria-hidden
        />
      )}

      {/* command palette */}
      <AnimatePresence>
        {palette && (
          <motion.div
            key="palette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.15 }}
            onClick={() => setPalette(false)}
            className="fixed inset-0 z-[95] flex items-start justify-center bg-black/70 px-4 pt-[15vh] backdrop-blur-sm"
          >
            <div
              role="dialog"
              aria-label="Command palette"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded border border-cyan-400/60 bg-black/95 font-mono text-sm shadow-[0_0_30px_rgba(0,200,255,0.2)]"
            >
              <div className="flex items-center gap-2 border-b border-cyan-900 px-4 py-3">
                <span className="text-cyan-700">&gt;</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSel(0);
                  }}
                  onKeyDown={onPaletteKey}
                  placeholder="type a command or section..."
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 bg-transparent text-cyan-300 placeholder-cyan-900 caret-cyan-400 outline-none"
                />
                <kbd className="text-xs text-cyan-800">esc</kbd>
              </div>
              <ul className="max-h-72 overflow-y-auto p-2">
                {filtered.length === 0 && (
                  <li className="px-3 py-3 text-cyan-800">no matches</li>
                )}
                {filtered.map((item, i) => (
                  <li key={item.label}>
                    <button
                      onClick={() => runItem(item)}
                      onMouseEnter={() => setSel(i)}
                      className={`flex w-full items-center justify-between rounded px-3 py-2 text-left ${
                        i === sel ? "bg-cyan-400/10 text-cyan-300" : "text-cyan-500"
                      }`}
                    >
                      <span>./{item.label}</span>
                      <span className="text-xs text-cyan-800">{item.hint}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* tiny toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[96] -translate-x-1/2 rounded border border-cyan-400 bg-black/90 px-4 py-2 font-mono text-xs text-cyan-300"
        >
          {toast}
        </div>
      )}
    </>
  );
}
