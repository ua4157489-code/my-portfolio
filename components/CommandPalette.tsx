"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CONTACT } from "@/data/content";

const RESUME_URL = "/resume.pdf";

const SECTIONS: [string, string][] = [
  ["top", "Top"],
  ["about", "About"],
  ["experience", "Experience"],
  ["education", "Education"],
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["contact", "Contact"],
];

type Cmd = { label: string; hint: string; run: () => void };

const go = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const openUrl = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

export default function CommandPalette() {
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const commands: Cmd[] = useMemo(
    () => [
      ...SECTIONS.map(([id, label]) => ({
        label: "Go to " + label,
        hint: "section",
        run: () => go(id),
      })),
      {
        label: "Open terminal",
        hint: "Ctrl /",
        run: () =>
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "/", ctrlKey: true })),
      },
      { label: "Open GitHub", hint: "link", run: () => openUrl(CONTACT.github) },
      ...(CONTACT.linkedin
        ? [{ label: "Open LinkedIn", hint: "link", run: () => openUrl(CONTACT.linkedin) }]
        : []),
      ...(CONTACT.instagram
        ? [{ label: "Open Instagram", hint: "link", run: () => openUrl(CONTACT.instagram) }]
        : []),
      ...(CONTACT.facebook
        ? [{ label: "Open Facebook", hint: "link", run: () => openUrl(CONTACT.facebook) }]
        : []),
      ...(CONTACT.email
        ? [
            {
              label: "Send an email",
              hint: "mail",
              run: () => {
                window.location.href = "mailto:" + CONTACT.email;
              },
            },
          ]
        : []),
      { label: "Open resume", hint: "pdf", run: () => openUrl(RESUME_URL) },
    ],
    []
  );

  const results = commands.filter((c) =>
    c.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    const open = () => {
      setQuery("");
      setIndex(0);
      setShow(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery("");
        setIndex(0);
        setShow((s) => !s);
      } else if (e.key === "Escape") {
        setShow(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", open);
    };
  }, []);

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
      setShow(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShow(false)}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[16vh] backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: -12, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -12, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-acc-1/30 bg-black/90 font-mono shadow-[0_0_60px_rgba(34,211,238,0.15)]"
          >
            <div className="flex items-center gap-3 border-b border-acc-1/20 px-4 py-3">
              <span className="text-acc-1">&gt;</span>
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
                <li className="px-3 py-6 text-center text-xs text-slate-500">
                  No match. Try &quot;about&quot; or &quot;github&quot;.
                </li>
              )}
              {results.map((c, i) => (
                <li key={c.label}>
                  <button
                    onClick={() => {
                      c.run();
                      setShow(false);
                    }}
                    onMouseEnter={() => setIndex(i)}
                    className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm ${
                      i === index ? "bg-acc-1/15 text-white" : "text-slate-300"
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="text-xs text-acc-2">{c.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
