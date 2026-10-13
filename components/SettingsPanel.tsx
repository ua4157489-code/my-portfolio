"use client";

import { useEffect, useRef, useState } from "react";
import * as FM from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";

type Settings = { accent: string; motion: "full" | "calm"; text: "normal" | "large" };

const KEY = "portfolio-settings";
const DEFAULTS: Settings = { accent: "auto", motion: "full", text: "normal" };

const ACCENTS = [
  { id: "auto", label: "Per section", css: "conic-gradient(#22d3ee, #ff4d9d, #a78bfa, #fbbf24, #22d3ee)" },
  { id: "#22d3ee", label: "Cyan", css: "#22d3ee" },
  { id: "#ff4d9d", label: "Pink", css: "#ff4d9d" },
  { id: "#a78bfa", label: "Violet", css: "#a78bfa" },
  { id: "#fbbf24", label: "Amber", css: "#fbbf24" },
  { id: "#34d399", label: "Green", css: "#34d399" },
];

function apply(s: Settings) {
  const root = document.documentElement;
  if (s.accent === "auto") root.style.removeProperty("--user-accent");
  else root.style.setProperty("--user-accent", s.accent);
  root.dataset.motion = s.motion;
  root.dataset.text = s.text;
  // makes every framer-motion animation jump straight to its end state
  const cfg = (FM as unknown as { MotionGlobalConfig?: { skipAnimations?: boolean } })
    .MotionGlobalConfig;
  if (cfg) cfg.skipAnimations = s.motion === "calm";
}

export default function SettingsPanel() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // load saved settings; first-time visitors who prefer reduced motion start calm
  useEffect(() => {
    let next = DEFAULTS;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) next = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
      else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        next = { ...DEFAULTS, motion: "calm" };
    } catch {
      /* storage unavailable */
    }
    setS(next);
    apply(next);
  }, []);

  // Esc or a click outside closes the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    apply(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  const reset = () => {
    setS(DEFAULTS);
    apply(DEFAULTS);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  };

  const seg = (on: boolean) =>
    `flex-1 rounded px-3 py-2 text-xs transition ${
      on ? "bg-cyan-300 font-semibold text-black" : "text-slate-200 hover:bg-white/10"
    }`;

  return (
    <div ref={box} className="fixed bottom-5 left-5 z-[60]">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Display settings"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            className="absolute bottom-14 left-0 w-72 rounded-xl border border-white/15 bg-[#070b14]/95 p-4 text-sm text-white shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md"
          >
            <p className="mb-4 font-semibold">Display settings</p>

            <p className="mb-2 text-xs text-slate-300">Accent color</p>
            <div className="mb-5 flex gap-2" role="group" aria-label="Accent color">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => update({ accent: a.id })}
                  aria-label={a.label}
                  aria-pressed={s.accent === a.id}
                  title={a.label}
                  style={{ background: a.css }}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    s.accent === a.id ? "scale-110 border-white" : "border-transparent hover:border-white/60"
                  }`}
                />
              ))}
            </div>

            <p className="mb-2 text-xs text-slate-300">Motion</p>
            <div className="mb-5 flex gap-1 rounded border border-white/15 p-1" role="group" aria-label="Motion">
              <button onClick={() => update({ motion: "full" })} aria-pressed={s.motion === "full"} className={seg(s.motion === "full")}>
                Full
              </button>
              <button onClick={() => update({ motion: "calm" })} aria-pressed={s.motion === "calm"} className={seg(s.motion === "calm")}>
                Calm
              </button>
            </div>

            <p className="mb-2 text-xs text-slate-300">Text size</p>
            <div className="mb-5 flex gap-1 rounded border border-white/15 p-1" role="group" aria-label="Text size">
              <button onClick={() => update({ text: "normal" })} aria-pressed={s.text === "normal"} className={seg(s.text === "normal")}>
                Normal
              </button>
              <button onClick={() => update({ text: "large" })} aria-pressed={s.text === "large"} className={seg(s.text === "large")}>
                Large
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={reset} className="text-xs text-pink-300 hover:underline">
                Reset
              </button>
              <p className="text-[11px] text-slate-400">Saved on this device</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Display settings"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/70 text-lg text-white shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur transition hover:border-cyan-300 hover:text-cyan-200"
      >
        <span aria-hidden>⚙</span>
      </button>
    </div>
  );
}
