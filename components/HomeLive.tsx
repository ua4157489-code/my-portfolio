"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const USER = "ua4157489-code";

// edit these to match what you're working on right now
const NOW = [
  { tag: "LAB", title: "OWASP Top 10 labs", note: "Working through every category on OWASP Juice Shop, with findings and remediation written up." },
  { tag: "SCAN", title: "Vulnerability assessment", note: "OpenVAS scanning, following NIST SP 800-115 and PTES." },
  { tag: "BUILD", title: "My own Python security tool", note: "A large tool in Python, documented and published on GitHub." },
];

type Item = { id: string; repo: string; msg: string; at: string };

function ago(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 3600) return `${Math.floor(s / 60) || 1}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function GlowCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    el.style.setProperty("--rx", `${(y / r.height - 0.5) * -8}deg`);
    el.style.setProperty("--ry", `${(x / r.width - 0.5) * 10}deg`);
  };
  const leave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };
  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-5 transition-transform duration-200"
      style={{ transform: "perspective(800px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(34,211,238,0.18), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function HomeLive() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.github.com/users/${USER}/events/public?per_page=40`
        );
        if (!res.ok) throw new Error("github");
        const events = await res.json();
        const out: Item[] = [];
        for (const e of events) {
          if (e.type !== "PushEvent") continue;
          const commits = e.payload?.commits;
          out.push({
            id: e.id,
            repo: String(e.repo?.name ?? "").split("/")[1] ?? "repo",
            msg: commits?.length
              ? String(commits[commits.length - 1].message).split("\n")[0]
              : `Pushed to ${String(e.payload?.ref ?? "").replace("refs/heads/", "")}`,
            at: e.created_at,
          });
          if (out.length === 5) break;
        }
        if (!dead) setItems(out);
      } catch {
        if (!dead) setItems([]);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/80">
        Right now
      </p>
      <h2 className="mb-10 text-3xl font-semibold text-white md:text-4xl">
        Live from the lab
      </h2>

      <div className="grid gap-5 md:grid-cols-3">
        {NOW.map((n) => (
          <GlowCard key={n.title}>
            <span className="font-mono text-[11px] tracking-widest text-cyan-300">
              {n.tag}
            </span>
            <h3 className="mt-2 text-lg font-semibold text-white">{n.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{n.note}</p>
          </GlowCard>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-black/40 font-mono text-sm">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-xs text-slate-400">
          <span>
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            latest pushes on GitHub
          </span>
          <a
            href={`https://github.com/${USER}`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-300 hover:underline"
          >
            @{USER}
          </a>
        </div>
        <ul className="divide-y divide-white/5">
          {items === null &&
            [0, 1, 2].map((i) => (
              <li key={i} className="px-5 py-3">
                <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
              </li>
            ))}
          {items?.length === 0 && (
            <li className="px-5 py-4 text-slate-500">
              No public activity to show right now.
            </li>
          )}
          {items?.map((it) => (
            <li key={it.id} className="flex items-baseline gap-3 px-5 py-3">
              <span className="text-cyan-300">{it.repo}</span>
              <span className="min-w-0 flex-1 truncate text-slate-300">{it.msg}</span>
              <span className="shrink-0 text-xs text-slate-500">{ago(it.at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
