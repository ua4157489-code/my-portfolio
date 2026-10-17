"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Cat = "offensive" | "network" | "dev";
type Tool = {
  id: string;
  name: string;
  cat: Cat;
  phase: number;
  blurb: string;
  use: string[];
  flow: string[];
  cmd?: { label: string; text: string };
  docs: string;
  related: string[];
};

const CATS: Record<Cat, { label: string; color: string; rgb: string }> = {
  offensive: { label: "Offensive", color: "#ff4d9d", rgb: "255,77,157" },
  network: { label: "Network & SOC", color: "#22d3ee", rgb: "34,211,238" },
  dev: { label: "Dev & Infra", color: "#a78bfa", rgb: "167,139,250" },
};

const PHASES = ["Recon & scan", "Web testing", "Exploit", "Analyze & detect", "Build & automate"];

const TOOLS: Tool[] = [
  {
    id: "nmap", name: "Nmap", cat: "offensive", phase: 0,
    blurb: "Network and service discovery",
    use: ["Finds live hosts and open ports", "Identifies service names and versions", "Runs NSE scripts for basic checks"],
    flow: ["Discover hosts", "Scan ports", "Fingerprint services", "Save output for later steps"],
    cmd: { label: "Service and version scan", text: "nmap -sV -sC -p- 192.0.2.10" },
    docs: "https://nmap.org", related: ["wireshark", "metasploit"],
  },
  {
    id: "burp", name: "Burp Suite", cat: "offensive", phase: 1,
    blurb: "Intercepting proxy for web apps",
    use: ["Intercepts and edits HTTP(S) traffic", "Repeats and modifies single requests", "Maps an application's endpoints and parameters"],
    flow: ["Proxy the browser", "Browse the app to map it", "Send interesting requests to Repeater", "Validate and document findings"],
    docs: "https://portswigger.net/burp", related: ["zap", "nmap"],
  },
  {
    id: "zap", name: "OWASP ZAP", cat: "offensive", phase: 1,
    blurb: "Open-source web app scanner",
    use: ["Passive and active web scanning", "Spiders an application for pages", "Automation-friendly for CI pipelines"],
    flow: ["Spider the target", "Run a passive baseline", "Review alerts", "Verify each alert manually"],
    cmd: { label: "Passive baseline scan", text: "zap-baseline.py -t http://192.0.2.10" },
    docs: "https://www.zaproxy.org", related: ["burp", "docker"],
  },
  {
    id: "metasploit", name: "Metasploit", cat: "offensive", phase: 2,
    blurb: "Exploitation framework",
    use: ["Library of exploits, payloads and auxiliary modules", "Validates whether a weakness is really exploitable", "Post-exploitation modules for lab work"],
    flow: ["Search for a matching module", "Set target and options", "Run the check first", "Record evidence and clean up"],
    cmd: { label: "List scanner modules", text: 'msfconsole -q -x "search type:auxiliary scanner; exit"' },
    docs: "https://www.metasploit.com", related: ["nmap", "wireshark"],
  },
  {
    id: "wireshark", name: "Wireshark", cat: "network", phase: 3,
    blurb: "Packet capture and analysis",
    use: ["Captures live network traffic", "Decodes hundreds of protocols", "Follows TCP streams to inspect conversations"],
    flow: ["Capture on the right interface", "Apply a capture filter", "Narrow with display filters", "Follow the stream"],
    cmd: { label: "Capture 20 HTTP packets", text: 'tshark -i eth0 -f "tcp port 80" -c 20' },
    docs: "https://www.wireshark.org", related: ["nmap", "wazuh"],
  },
  {
    id: "wazuh", name: "Wazuh", cat: "network", phase: 3,
    blurb: "Open-source SIEM and XDR",
    use: ["Agents collect logs from endpoints", "Rules turn events into alerts", "File integrity, vulnerability and compliance checks"],
    flow: ["Install agents", "Collect and decode logs", "Match rules and raise alerts", "Investigate in the dashboard"],
    cmd: { label: "Check service status", text: "sudo /var/ossec/bin/wazuh-control status" },
    docs: "https://wazuh.com", related: ["wireshark", "linux"],
  },
  {
    id: "linux", name: "Linux", cat: "dev", phase: 4,
    blurb: "The operating system underneath it all",
    use: ["Permissions, processes and services", "Shell tooling for fast enumeration", "Where most security tools and servers run"],
    flow: ["Learn the filesystem and permissions", "Chain small commands with pipes", "Script the repeated work"],
    cmd: { label: "Find SUID binaries (privesc enumeration)", text: "find / -perm -4000 -type f 2>/dev/null" },
    docs: "https://www.kernel.org", related: ["python", "docker"],
  },
  {
    id: "python", name: "Python", cat: "dev", phase: 4,
    blurb: "Scripting and automation",
    use: ["Quick scripts for recon and parsing", "HTTP clients and API testing helpers", "Report and log processing"],
    flow: ["Create an isolated environment", "Install only what you need", "Write small, testable scripts"],
    cmd: { label: "Isolated environment", text: "python3 -m venv .venv && source .venv/bin/activate" },
    docs: "https://www.python.org", related: ["linux", "git"],
  },
  {
    id: "docker", name: "Docker", cat: "dev", phase: 4,
    blurb: "Containers for labs and tooling",
    use: ["Disposable vulnerable lab targets", "Reproducible tool environments", "Isolation between experiments"],
    flow: ["Pull an image", "Publish only the ports you need", "Break things safely", "Remove the container"],
    cmd: { label: "Spin up a vulnerable lab", text: "docker run --rm -it -p 3000:3000 bkimminich/juice-shop" },
    docs: "https://www.docker.com", related: ["linux", "zap"],
  },
  {
    id: "git", name: "Git/GitHub", cat: "dev", phase: 4,
    blurb: "Version control and portfolio",
    use: ["History for every lab and script", "Collaboration through pull requests", "Public proof of work"],
    flow: ["Commit small and often", "Write clear messages", "Push to GitHub", "Document each lab in a README"],
    cmd: { label: "Readable history", text: "git log --oneline --graph --decorate -10" },
    docs: "https://git-scm.com", related: ["python", "docker"],
  },
];

function hl(text: string, needle: string): ReactNode {
  const n = needle.trim().toLowerCase();
  if (!n) return text;
  const i = text.toLowerCase().indexOf(n);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-cyan-400/25 px-0.5 text-inherit">{text.slice(i, i + n.length)}</mark>
      {text.slice(i + n.length)}
    </>
  );
}

function Card({ t, q, onOpen }: { t: Tool; q: string; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const c = CATS[t.cat];
  const move = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || !ref.current) return;
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <motion.button
      ref={ref}
      layout
      type="button"
      onMouseMove={move}
      onClick={onOpen}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.22 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-xl border bg-black/40 p-4 text-left backdrop-blur transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
      style={{ borderColor: `rgba(${c.rgb},0.35)` } as CSSProperties}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(180px circle at var(--mx,50%) var(--my,50%), rgba(${c.rgb},0.22), transparent 70%)` }}
      />
      <span className="relative flex items-start justify-between gap-2">
        <span className="text-base text-slate-100">{hl(t.name, q)}</span>
        <span className="text-xs text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-200">↗</span>
      </span>
      <span className="relative mt-1 block text-[11px] uppercase tracking-widest" style={{ color: c.color }}>
        {c.label}
      </span>
      <span className="relative mt-2 block text-xs text-slate-400">{t.blurb}</span>
    </motion.button>
  );
}

export default function ToolboxPro() {
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat | "all">("all");
  const [view, setView] = useState<"grid" | "flow">("grid");
  const [sort, setSort] = useState<"cat" | "az">("cat");
  const [sel, setSel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const r = TOOLS.filter(
      (t) =>
        (cat === "all" || t.cat === cat) &&
        (!needle || `${t.name} ${CATS[t.cat].label} ${t.blurb} ${t.use.join(" ")}`.toLowerCase().includes(needle))
    );
    return sort === "az" ? [...r].sort((a, b) => a.name.localeCompare(b.name)) : r;
  }, [q, cat, sort]);

  const tool = TOOLS.find((t) => t.id === sel) ?? null;
  const tc = tool ? CATS[tool.cat] : null;
  const pos = tool ? list.findIndex((t) => t.id === tool.id) : -1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing && !sel) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape") {
        if (sel) setSel(null);
        else if (q) setQ("");
      } else if (sel && !typing && (e.key === "ArrowRight" || e.key === "ArrowLeft") && list.length > 0) {
        const i = list.findIndex((t) => t.id === sel);
        if (i < 0) return;
        const step = e.key === "ArrowRight" ? 1 : -1;
        setSel(list[(i + step + list.length) % list.length].id);
        setCopied(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, q, list]);

  useEffect(() => {
    if (!sel) return;
    const id = setTimeout(() => closeRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [sel]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  const open = (id: string) => {
    setSel(id);
    setCopied(false);
  };

  const chip = (active: boolean, color?: string): CSSProperties =>
    active
      ? { borderColor: color ?? "#22d3ee", background: `${color ?? "#22d3ee"}22`, color: "#fff" }
      : { borderColor: "rgba(255,255,255,0.12)" };

  return (
    <section id="toolbox" className="relative scroll-mt-24 font-mono">
      <p className="text-xs text-slate-500">
        Click a tool for details · press <kbd className="rounded border border-white/15 px-1.5 text-slate-300">/</kbd> to search
      </p>

      {/* controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search tools..."
            spellCheck={false}
            autoComplete="off"
            aria-label="Search tools"
            className="w-full rounded-xl border border-white/12 bg-black/40 py-2.5 pl-9 pr-9 text-sm text-slate-200 placeholder-slate-600 outline-none backdrop-blur transition focus:border-cyan-400/60 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-slate-400 hover:text-white">
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={cat === "all"} onClick={() => setCat("all")} className="rounded-full border px-4 py-1.5 text-sm text-slate-300 transition hover:text-white" style={chip(cat === "all")}>
            All <span className="ml-1 text-xs text-slate-500">{TOOLS.length}</span>
          </button>
          {(Object.keys(CATS) as Cat[]).map((k) => (
            <button key={k} type="button" aria-pressed={cat === k} onClick={() => setCat(cat === k ? "all" : k)} className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-slate-300 transition hover:text-white" style={chip(cat === k, CATS[k].color)}>
              <span className="h-2 w-2 rounded-full" style={{ background: CATS[k].color }} />
              {CATS[k].label}
              <span className="text-xs text-slate-500">{TOOLS.filter((t) => t.cat === k).length}</span>
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          <button type="button" onClick={() => setSort((s) => (s === "cat" ? "az" : "cat"))} className="rounded-lg border border-white/12 px-3 py-1.5 text-slate-300 transition hover:border-cyan-400/50">
            sort: {sort === "cat" ? "category" : "A–Z"}
          </button>
          <div className="flex overflow-hidden rounded-lg border border-white/12">
            {(["grid", "flow"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`px-3 py-1.5 transition ${view === v ? "bg-cyan-400/15 text-cyan-200" : "text-slate-400 hover:text-white"}`}>
                {v === "grid" ? "Grid" : "Workflow"}
              </button>
            ))}
          </div>
          <span className="tabular-nums">{list.length} / {TOOLS.length}</span>
        </div>
      </div>

      {/* results */}
      <div className="mt-6">
        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
            No tools match “{q}”.{" "}
            <button type="button" onClick={() => { setQ(""); setCat("all"); }} className="text-cyan-300 underline underline-offset-4">
              Reset filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
            <AnimatePresence initial={false}>
              {list.map((t) => (
                <Card key={t.id} t={t} q={q} onOpen={() => open(t.id)} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-[980px] items-stretch gap-2">
              {PHASES.map((p, i) => {
                const items = list.filter((t) => t.phase === i);
                return (
                  <div key={p} className="flex flex-1 items-stretch gap-2">
                    <div className="flex-1 rounded-xl border border-white/10 bg-black/30 p-3 backdrop-blur">
                      <p className="mb-3 text-[11px] tracking-widest text-cyan-300/70">{String(i + 1).padStart(2, "0")} {p.toUpperCase()}</p>
                      <div className="space-y-2">
                        {items.length === 0 ? (
                          <p className="text-xs text-slate-600">no match</p>
                        ) : (
                          items.map((t) => (
                            <button key={t.id} type="button" onClick={() => open(t.id)} className="block w-full rounded-lg border px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5" style={{ borderColor: `rgba(${CATS[t.cat].rgb},0.4)` }}>
                              {hl(t.name, q)}
                              <span className="block text-[10px] uppercase tracking-widest" style={{ color: CATS[t.cat].color }}>{CATS[t.cat].label}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    {i < PHASES.length - 1 && <span aria-hidden className="self-center text-cyan-500/60">→</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* detail drawer */}
      <AnimatePresence>
        {tool && tc && (
          <>
            <motion.div key="bd" className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSel(null)} />
            <motion.aside
              key="dr"
              role="dialog"
              aria-modal="true"
              aria-label={`${tool.name} details`}
              initial={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed right-0 top-0 z-[71] flex h-full w-[min(28rem,100vw)] flex-col border-l bg-[#060b14]/95 font-mono backdrop-blur-xl"
              style={{ borderColor: `rgba(${tc.rgb},0.45)` }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
                <div>
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: tc.color }}>{tc.label}</p>
                  <h3 className="mt-1 text-2xl font-bold text-white">{tool.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{tool.blurb}</p>
                </div>
                <button ref={closeRef} type="button" onClick={() => setSel(null)} aria-label="Close" className="rounded-lg border border-white/12 px-3 py-1.5 text-slate-300 transition hover:border-cyan-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70">
                  esc
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-5 text-sm">
                <div>
                  <p className="mb-2 text-[11px] tracking-widest text-slate-500">WHAT IT DOES</p>
                  <ul className="space-y-1.5 text-slate-300">
                    {tool.use.map((u) => (
                      <li key={u} className="flex gap-2"><span style={{ color: tc.color }}>▸</span>{u}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-2 text-[11px] tracking-widest text-slate-500">TYPICAL FLOW</p>
                  <ol className="space-y-1.5 text-slate-300">
                    {tool.flow.map((f, i) => (
                      <li key={f} className="flex gap-3"><span className="w-5 text-right text-slate-600">{i + 1}.</span>{f}</li>
                    ))}
                  </ol>
                </div>

                {tool.cmd && (
                  <div>
                    <p className="mb-2 text-[11px] tracking-widest text-slate-500">{tool.cmd.label.toUpperCase()}</p>
                    <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-black/50 p-3">
                      <code className="flex-1 break-all text-xs text-cyan-200">$ {tool.cmd.text}</code>
                      <button type="button" onClick={() => copy(tool.cmd!.text)} className="shrink-0 rounded border border-white/12 px-2 py-1 text-xs text-slate-300 transition hover:border-cyan-400/60 hover:text-white">
                        {copied ? "copied ✓" : "copy"}
                      </button>
                    </div>
                    {tool.cat === "offensive" && (
                      <p className="mt-2 text-[11px] text-amber-300/80">Use only against systems you own or are explicitly authorized to test. 192.0.2.x is a documentation-only range.</p>
                    )}
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[11px] tracking-widest text-slate-500">PAIRS WELL WITH</p>
                  <div className="flex flex-wrap gap-2">
                    {tool.related.map((id) => {
                      const r = TOOLS.find((x) => x.id === id);
                      if (!r) return null;
                      return (
                        <button key={id} type="button" onClick={() => open(id)} className="rounded-full border px-3 py-1 text-xs text-slate-200 transition hover:bg-white/5" style={{ borderColor: `rgba(${CATS[r.cat].rgb},0.5)` }}>
                          {r.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 p-4 text-xs text-slate-500">
                <span>{pos >= 0 ? `${pos + 1} / ${list.length}` : "—"} · ← → to browse</span>
                <a href={tool.docs} target="_blank" rel="noopener noreferrer" className="rounded-lg border px-3 py-1.5 text-slate-200 transition hover:bg-white/5" style={{ borderColor: `rgba(${tc.rgb},0.5)` }}>
                  Official site ↗
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
