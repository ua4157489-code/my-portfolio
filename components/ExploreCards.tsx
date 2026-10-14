"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

const KEY = "portfolio-explored";

const CARDS = [
  { href: "/about", kicker: "Who I am and what I focus on", title: "About", desc: "My background, focus areas and the tools I work with.", chip: "8 focus areas", color: "#22d3ee" },
  { href: "/experience", kicker: "Where I have worked", title: "Experience", desc: "Roles and the skills I used in each.", chip: "Red Team Intern · Tkxel", color: "#f43f5e" },
  { href: "/education", kicker: "Where I studied", title: "Education", desc: "Diplomas, schools and courses.", chip: "Diplomas & courses", color: "#a78bfa" },
  { href: "/skills", kicker: "What I can do", title: "Skills", desc: "Search and filter every skill by category and place.", chip: "59 skills · 9 categories", color: "#fbbf24" },
  { href: "/projects", kicker: "What I have built", title: "Projects", desc: "Labs and tools, with live GitHub numbers.", chip: "Live GitHub stats", color: "#22d3ee" },
  { href: "/contact", kicker: "Let's talk", title: "Contact", desc: "Send a message or reach me directly.", chip: "Email or form", color: "#a78bfa" },
];

function Card({
  c,
  i,
  visited,
  onGo,
}: {
  c: (typeof CARDS)[number];
  i: number;
  visited: boolean;
  onGo: (href: string) => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const move = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    el.style.setProperty("--rx", `${(y / r.height - 0.5) * -9}deg`);
    el.style.setProperty("--ry", `${(x / r.width - 0.5) * 11}deg`);
  };
  const leave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (i % 3) * 0.08 }}
    >
      <Link
        ref={ref}
        href={c.href}
        onClick={() => onGo(c.href)}
        onMouseMove={move}
        onMouseLeave={leave}
        className="group relative block h-full overflow-hidden rounded-2xl border bg-black/40 p-6 transition-transform duration-200 will-change-transform"
        style={
          {
            "--c": c.color,
            borderColor: `${c.color}33`,
            transform: "perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
          } as CSSProperties
        }
      >
        {/* accent bar */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${c.color}, transparent)` }}
        />
        {/* cursor spotlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(280px circle at var(--mx,50%) var(--my,50%), color-mix(in srgb, var(--c) 22%, transparent), transparent 70%)",
          }}
        />

        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-sm" style={{ color: c.color }}>
              {c.kicker}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {visited && (
                <span title="Visited" className="font-mono text-xs" style={{ color: c.color }}>
                  ✓
                </span>
              )}
              <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono text-[11px] text-slate-400">
                {i + 1}
              </kbd>
            </div>
          </div>

          <h3 className="mt-3 text-3xl font-bold text-white">{c.title}</h3>
          <p className="mt-3 text-slate-400">{c.desc}</p>

          <div className="mt-auto flex items-end justify-between pt-6">
            <span className="inline-flex items-center gap-2 font-mono text-sm text-white">
              Open page
              <span className="transition-transform duration-200 group-hover:translate-x-1.5">→</span>
            </span>
            <span
              className="rounded-full border px-2.5 py-1 font-mono text-[11px]"
              style={{ borderColor: `${c.color}55`, color: c.color }}
            >
              {c.chip}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ExploreCards() {
  const router = useRouter();
  const [visited, setVisited] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setVisited(JSON.parse(raw));
    } catch {}
  }, []);

  const go = useCallback(
    (href: string) => {
      setVisited((prev) => {
        if (prev.includes(href)) return prev;
        const next = [...prev, href];
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  // press 1 to 6 to jump to a page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= CARDS.length) {
        go(CARDS[n - 1].href);
        router.push(CARDS[n - 1].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, router]);

  const count = CARDS.filter((c) => visited.includes(c.href)).length;

  return (
    <section id="explore" className="relative z-10 mx-auto max-w-[1600px] px-8 py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/80">
            Explore
          </p>
          <h2 className="mt-2 text-4xl font-semibold text-white md:text-5xl">
            Pick a page
          </h2>
          <p className="mt-3 max-w-xl text-slate-400">
            Every part of my portfolio has its own page. Click a card, or press a number key.
          </p>
        </div>

        <div className="w-56">
          <div className="mb-2 flex justify-between font-mono text-xs text-slate-400">
            <span>explored</span>
            <span>
              {count} / {CARDS.length}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all duration-500"
              style={{ width: `${(count / CARDS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c, i) => (
          <Card key={c.href} c={c} i={i} visited={visited.includes(c.href)} onGo={go} />
        ))}
      </div>
    </section>
  );
}
