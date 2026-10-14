"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import "./about.css";

/* ------------------------------------------------------------------ */
/* Block: numbered heading + animated body                             */
/* ------------------------------------------------------------------ */
export function Block({
  no,
  title,
  hint,
  children,
}: {
  no: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="ab-block">
      <header className="mb-8">
        <span className="ab-eyebrow">
          {no} / {title}
        </span>
        <h3 className="ab-title">{title}</h3>
        {hint && <p className="ab-hint">{hint}</p>}
      </header>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ProfileCard: photo with tilt, scan line and HUD corners             */
/* ------------------------------------------------------------------ */
export function ProfileCard({
  src,
  name,
  role,
  lines,
}: {
  src: string;
  name: string;
  role: string;
  lines: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="ab-profile">
      <div className="ab-profile-photo">
        <Image
          src={src}
          alt={`Portrait of ${name}`}
          width={800}
          height={800}
          priority
          className="h-auto w-full"
        />
        <span className="ab-scan" aria-hidden />
        <i className="ab-corner ab-c1" aria-hidden />
        <i className="ab-corner ab-c2" aria-hidden />
        <i className="ab-corner ab-c3" aria-hidden />
        <i className="ab-corner ab-c4" aria-hidden />
      </div>
      <div className="ab-profile-meta">
        <p className="ab-profile-name">{name}</p>
        <p className="ab-profile-role">{role}</p>
        <ul>
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CountStats: numbers count up when scrolled into view                */
/* ------------------------------------------------------------------ */
export function CountStats({
  items,
}: {
  items: { label: string; value: number; suffix?: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vals, setVals] = useState<number[]>(() => items.map(() => 0));
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (reduce) {
          setVals(items.map((i) => i.value));
          return;
        }
        const t0 = performance.now();
        const dur = 1400;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const k = 1 - Math.pow(1 - p, 3);
          setVals(items.map((i) => Math.round(i.value * k)));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [items, reduce]);

  return (
    <div ref={ref} className="ab-stats">
      {items.map((it, i) => (
        <div key={it.label} className="ab-stat">
          <div className="ab-stat-num">
            {vals[i]}
            {it.suffix}
          </div>
          <div className="ab-stat-label">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AboutTerminal: click a command chip or type your own                */
/* ------------------------------------------------------------------ */
type Command = { cmd: string; out: string[] };
type Entry = { id: number; cmd: string; out: string[]; shown: number };

export function AboutTerminal({ commands }: { commands: Command[] }) {
  const [log, setLog] = useState<Entry[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const idRef = useRef(0);
  const timer = useRef<number>(0);
  const hist = useRef<string[]>([]);
  const hi = useRef(-1);
  const body = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const started = useRef(false);
  const reduce = useReducedMotion();

  const run = (raw: string) => {
    const text = raw.trim();
    const cmd = text.toLowerCase();
    if (!cmd || busy) return;
    hist.current.unshift(text);
    hi.current = -1;

    if (cmd === "clear") {
      setLog([]);
      return;
    }
    let out: string[];
    if (cmd === "help") {
      out = ["available commands:", ...commands.map((c) => `  ${c.cmd}`), "  clear"];
    } else {
      const found = commands.find((c) => c.cmd === cmd);
      out = found ? found.out : [`command not found: ${cmd}`, "type 'help' to list commands"];
    }

    const id = ++idRef.current;
    if (reduce) {
      setLog((l) => [...l, { id, cmd: text, out, shown: out.length }]);
      return;
    }
    setLog((l) => [...l, { id, cmd: text, out, shown: 0 }]);
    setBusy(true);
    let n = 0;
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      n++;
      setLog((l) => l.map((e) => (e.id === id ? { ...e, shown: n } : e)));
      if (n >= out.length) {
        window.clearInterval(timer.current);
        setBusy(false);
      }
    }, 120);
  };

  // always call the latest run() from the observer below
  const runRef = useRef(run);
  runRef.current = run;

  // auto-run "whoami" the first time the terminal is visible
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          runRef.current("whoami");
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer.current);
    };
  }, []);

  // keep the newest output in view (inside the terminal only)
  useEffect(() => {
    const b = body.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [log]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(value);
      setValue("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      hi.current = Math.min(hi.current + 1, hist.current.length - 1);
      setValue(hist.current[hi.current] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      hi.current = Math.max(hi.current - 1, -1);
      setValue(hi.current === -1 ? "" : hist.current[hi.current]);
    }
  };

  return (
    <div ref={box} className="ab-card ab-term">
      <div className="ab-term-bar">
        <span className="ab-dot" />
        <span className="ab-dot" />
        <span className="ab-dot" />
        <span className="ml-2">about.sh : interactive</span>
      </div>

      <div
        ref={body}
        className="ab-term-body"
        onClick={() => input.current?.focus({ preventScroll: true })}
      >
        {log.map((e) => (
          <div key={e.id}>
            <div>
              <span className="ab-prompt">visitor@portfolio:~$</span> {e.cmd}
            </div>
            <div className="ab-out">{e.out.slice(0, e.shown).join("\n")}</div>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="ab-prompt">visitor@portfolio:~$</span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            placeholder={log.length ? "" : "type help"}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal command"
            className="ab-input"
          />
          {!value && <span className="ab-cursor" aria-hidden />}
        </div>
      </div>

      <div className="ab-term-chips">
        {commands.map((c) => (
          <button key={c.cmd} type="button" className="ab-chip" onClick={() => run(c.cmd)}>
            {c.cmd}
          </button>
        ))}
        <button type="button" className="ab-chip" onClick={() => run("help")}>
          help
        </button>
        <button type="button" className="ab-chip" onClick={() => run("clear")}>
          clear
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StoryTabs: accessible tabs, arrow keys, auto-advance with progress  */
/* ------------------------------------------------------------------ */
export function StoryTabs({ items }: { items: { label: string; text: string }[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [cycle, setCycle] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  const MS = 9000;
  const auto = !touched && !reduce && items.length > 1;

  useEffect(() => {
    if (!auto || paused) return;
    const t = setTimeout(() => setI((n) => (n + 1) % items.length), MS);
    return () => clearTimeout(t);
  }, [i, cycle, auto, paused, items.length]);

  const go = (n: number, focus = false) => {
    const next = (n + items.length) % items.length;
    setI(next);
    setTouched(true);
    if (focus) tabs.current[next]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(i + 1, true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(i - 1, true);
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0, true);
    } else if (e.key === "End") {
      e.preventDefault();
      go(items.length - 1, true);
    }
  };

  if (!items.length) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setCycle((c) => c + 1);
      }}
    >
      <div role="tablist" aria-label="About story" className="ab-tablist" onKeyDown={onKey}>
        {items.map((it, n) => (
          <button
            key={it.label}
            ref={(el) => {
              tabs.current[n] = el;
            }}
            role="tab"
            id={`ab-tab-${n}`}
            aria-selected={i === n}
            aria-controls="ab-panel"
            tabIndex={i === n ? 0 : -1}
            type="button"
            className="ab-tab"
            onClick={() => go(n)}
          >
            {it.label}
            {i === n && (
              <motion.span
                layoutId="ab-tab-line"
                className="ab-tab-line"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        ))}
        {auto && (
          <span
            key={`${i}-${cycle}`}
            className="ab-progress"
            aria-hidden
            style={{
              animationDuration: `${MS}ms`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          role="tabpanel"
          id="ab-panel"
          aria-labelledby={`ab-tab-${i}`}
          className="ab-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: reduce ? 0 : 0.28 }}
        >
          {items[i].text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FocusGrid: cards with cursor spotlight and 3D tilt                  */
/* ------------------------------------------------------------------ */
export function FocusGrid({ areas }: { areas: { label: string; icon: ReactNode }[] }) {
  const onMove = (e: MouseEvent<HTMLLIElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    el.style.setProperty("--rx", `${(-(y / r.height - 0.5) * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x / r.width - 0.5) * 8).toFixed(2)}deg`);
  };
  const onLeave = (e: MouseEvent<HTMLLIElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  return (
    <ul className="ab-focus-grid">
      {areas.map((a, n) => (
        <motion.li
          key={a.label}
          className="ab-focus"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, delay: (n % 4) * 0.07 }}
        >
          <span className="ab-focus-n">{String(n + 1).padStart(2, "0")}</span>
          <span className="ab-focus-icon">{a.icon}</span>
          <p className="ab-focus-label">{a.label}</p>
          <span className="ab-focus-bar" />
        </motion.li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* ToolsExplorer: filter by category, search by name                   */
/* ------------------------------------------------------------------ */
const PALETTE = ["#ff4d9d", "#22d3ee", "#a78bfa", "#fbbf24", "#34d399"];

export function ToolsExplorer({ tools }: { tools: { name: string; cat: string }[] }) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const reduce = useReducedMotion();

  const cats = useMemo(() => ["All", ...Array.from(new Set(tools.map((t) => t.cat)))], [tools]);
  const colorOf = (c: string) => PALETTE[Math.max(0, cats.indexOf(c) - 1) % PALETTE.length];

  const shown = tools.filter(
    (t) =>
      (cat === "All" || t.cat === cat) && t.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="ab-search min-w-[14rem] flex-1 md:max-w-xs">
          <span aria-hidden className="text-slate-500">
            ⌕
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search tools..."
            aria-label="Search tools"
            spellCheck={false}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="text-slate-500 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              className="ab-chip"
              aria-pressed={cat === c}
              style={c === "All" ? undefined : ({ "--c": colorOf(c) } as React.CSSProperties)}
              onClick={() => setCat(c)}
            >
              {c !== "All" && <i />}
              {c}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-xs text-slate-500" aria-live="polite">
          {shown.length} / {tools.length}
        </span>
      </div>

      <ul className="flex flex-wrap gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((t) => (
            <motion.li
              key={t.name}
              layout={!reduce}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: reduce ? 0 : 0.22 }}
              className="ab-tool"
              style={{ "--c": colorOf(t.cat) } as React.CSSProperties}
            >
              {t.name}
              <small>{t.cat}</small>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {shown.length === 0 && (
        <p className="mt-4 font-mono text-sm text-slate-500">no tools match &quot;{q}&quot;</p>
      )}
    </div>
  );
}
