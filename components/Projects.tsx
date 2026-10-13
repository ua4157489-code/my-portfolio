"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as RMouseEvent, PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SplitSection from "@/components/SplitSection";
import { PROJECTS, CONTACT } from "@/data/content";

type Item = {
  name: string;
  description: string;
  tags: string[];
  href: string;
  stars?: number;
  forks?: number;
  pushed?: string;
  language?: string;
  synced?: boolean;
  featured?: boolean;
  modules?: { folder: string; label: string; note?: string }[];
};

type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
};

type View = "carousel" | "grid";
type Sort = "featured" | "updated" | "stars" | "az";

const user = CONTACT.github.replace(/\/+$/, "").split("/").pop() ?? "";
const CACHE_KEY = "gh-repos-v2";
const CACHE_MS = 10 * 60 * 1000; // GitHub allows 60 anonymous requests per hour, so cache for 10 minutes

const mapRepo = (r: Repo): Item => ({
  name: r.name,
  description: r.description ?? "No description yet.",
  tags: [r.language, ...(r.topics ?? []).slice(0, 3)].filter(Boolean) as string[],
  href: r.html_url,
  stars: r.stargazers_count,
  forks: r.forks_count,
  pushed: r.pushed_at,
  language: r.language ?? undefined,
  synced: true,
});

const ago = (iso?: string) => {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "today";
  if (d < 30) return `${Math.floor(d)}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

function Card({
  p,
  i,
  onOpen,
  className = "",
}: {
  p: Item;
  i: number;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05 }}
      className={`tile group flex select-none flex-col p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold text-white">{p.name}</h3>
        {p.featured && (
          <span className="shrink-0 rounded-full border border-[var(--accent)] px-2 py-0.5 text-[11px] text-[var(--accent)]">
            Featured
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-5 flex-1 text-sm leading-relaxed text-slate-200">{p.description}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {p.tags.map((t) => (
          <li key={t} className="rounded border border-white/15 px-2 py-0.5 text-xs text-slate-200">
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
        {p.language && <span>{p.language}</span>}
        {typeof p.stars === "number" && <span>★ {p.stars}</span>}
        {typeof p.forks === "number" && <span>⑂ {p.forks}</span>}
        {p.pushed && <span>updated {ago(p.pushed)}</span>}
        {p.modules && <span>{p.modules.length} modules</span>}
        {!p.synced && <span>not synced yet</span>}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={onOpen}
          className="flex-1 rounded border border-white/25 px-3 py-2 text-sm text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Details
        </button>
        <a
          href={p.href}
          target="_blank"
          rel="noopener noreferrer"
          draggable={false}
          className="flex-1 rounded bg-[var(--accent)] px-3 py-2 text-center text-sm font-semibold text-black transition hover:brightness-110"
        >
          Open repo ↗
        </a>
      </div>
    </motion.article>
  );
}

export default function Projects() {
  const [repos, setRepos] = useState<Item[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [tag, setTag] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [view, setView] = useState<View>("carousel");
  const [openName, setOpenName] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, moved: false, x: 0, left: 0 });
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  // live repos from GitHub, cached so refreshes do not hit the rate limit
  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const c = JSON.parse(raw) as { t: number; data: Item[] };
        if (Date.now() - c.t < CACHE_MS) {
          setRepos(c.data);
          setStatus("ok");
          return;
        }
      }
    } catch {
      /* ignore bad cache */
    }
    fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=30`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Repo[]>;
      })
      .then((data) => {
        if (cancelled) return;
        const mapped = data.filter((r) => !r.fork && !r.archived && r.name !== "my-portfolio").map(mapRepo);
        setRepos(mapped);
        setStatus("ok");
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: mapped }));
        } catch {
          /* storage unavailable */
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // remember the chosen view
  useEffect(() => {
    try {
      const v = localStorage.getItem("projects-view");
      if (v === "carousel" || v === "grid") setView(v);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem("projects-view", v);
    } catch {
      /* storage unavailable */
    }
  };

  // your hand-written projects first (enriched with live GitHub numbers), then extra repos
  const items = useMemo(() => {
    const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));
    const manual: Item[] = PROJECTS.map((p) => {
      const r = byName.get(p.name.toLowerCase());
      return {
        ...p,
        featured: true,
        stars: r?.stars,
        forks: r?.forks,
        pushed: r?.pushed,
        language: r?.language,
        synced: !!r,
      };
    });
    const names = new Set(manual.map((p) => p.name.toLowerCase()));
    return [...manual, ...repos.filter((r) => !names.has(r.name.toLowerCase()))];
  }, [repos]);

  const tags = useMemo(() => {
    const count = new Map<string, number>();
    items.forEach((i) => i.tags.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
    return [
      { t: "All", n: items.length },
      ...[...count.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([t, n]) => ({ t, n })),
    ];
  }, [items]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = items.filter(
      (i) =>
        (tag === "All" || i.tags.includes(tag)) &&
        `${i.name} ${i.description} ${i.tags.join(" ")} ${(i.modules ?? []).map((m) => m.label).join(" ")}`.toLowerCase().includes(query)
    );
    if (sort === "updated") list.sort((a, b) => (b.pushed ?? "").localeCompare(a.pushed ?? ""));
    if (sort === "stars") list.sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [items, tag, q, sort]);

  const stats = useMemo(() => {
    const latest = items.reduce((m, i) => ((i.pushed ?? "") > m ? (i.pushed ?? "") : m), "");
    return [
      { label: "projects", value: String(items.length) },
      { label: "GitHub repos synced", value: status === "ok" ? String(repos.length) : "–" },
      { label: "total stars", value: String(items.reduce((n, i) => n + (i.stars ?? 0), 0)) },
      { label: "last push", value: latest ? ago(latest) : "–" },
    ];
  }, [items, repos.length, status]);

  // carousel progress + reset
  const onScroll = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }, []);
  useEffect(() => {
    rail.current?.scrollTo({ left: 0 });
    const t = setTimeout(onScroll, 50);
    return () => clearTimeout(t);
  }, [tag, q, sort, view, onScroll]);

  // mouse drag-to-scroll (touch already scrolls natively)
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !rail.current) return;
    drag.current = { down: true, moved: false, x: e.clientX, left: rail.current.scrollLeft };
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.down || !rail.current) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved) rail.current.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    if (!drag.current.down) return;
    drag.current.down = false;
    setDragging(false);
  };
  const onClickCapture = (e: RMouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };
  const nudge = (dir: number) =>
    rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: "smooth" });

  // details modal
  const idx = openName ? shown.findIndex((p) => p.name === openName) : -1;
  const current = idx >= 0 ? shown[idx] : null;
  const step = useCallback(
    (d: number) => {
      if (!shown.length) return;
      const from = idx < 0 ? 0 : idx;
      setOpenName(shown[(from + d + shown.length) % shown.length].name);
    },
    [idx, shown]
  );

  useEffect(() => {
    if (!current) return;
    closeRef.current?.focus();
  }, [current?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openName) {
        if (e.key === "Escape") setOpenName(null);
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
        return;
      }
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key !== "/" || typing || e.ctrlKey || e.metaKey || e.altKey) return;
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > window.innerHeight) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openName, step]);

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(msg);
    } catch {
      flash("Could not copy");
    }
  };

  const surprise = () => {
    if (!shown.length) return;
    setOpenName(shown[Math.floor(Math.random() * shown.length)].name);
  };

  const ctl =
    "rounded border border-white/20 bg-black/60 px-3 py-2 text-xs text-slate-100 transition hover:border-[var(--accent)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <SplitSection id="projects">
      <div ref={wrapRef}>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((st) => (
            <div key={st.label} className="tile p-4 text-center">
              <p className="text-2xl font-bold text-white">{st.value}</p>
              <p className="mt-1 text-xs text-slate-300">{st.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="search projects..."
                aria-label="Search projects"
                className="w-full rounded border border-white/20 bg-black/60 px-4 py-2 pr-10 text-sm text-white placeholder:text-slate-400 focus:border-[var(--accent)] focus:outline-none"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/20 px-1.5 text-[10px] text-slate-300 sm:block">
                /
              </kbd>
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort projects"
              className={ctl}
            >
              <option value="featured">Sort: featured first</option>
              <option value="updated">Sort: recently updated</option>
              <option value="stars">Sort: most stars</option>
              <option value="az">Sort: A to Z</option>
            </select>

            <div className="flex overflow-hidden rounded border border-white/20" role="group" aria-label="View">
              {(["carousel", "grid"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => changeView(v)}
                  aria-pressed={view === v}
                  className={`px-3 py-2 text-xs transition ${
                    view === v ? "bg-[var(--accent)] font-semibold text-black" : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {v === "carousel" ? "Carousel" : "Grid"}
                </button>
              ))}
            </div>

            <button onClick={surprise} className={ctl}>
              Surprise me
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300" aria-live="polite">
            <span>
              Showing {shown.length} of {items.length}
            </span>
            <span>
              {status === "loading" && "syncing with GitHub..."}
              {status === "ok" && "live numbers from GitHub"}
              {status === "error" && "GitHub sync unavailable, showing saved projects"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map(({ t, n }) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  tag === t
                    ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-black"
                    : "border-white/20 text-slate-200 hover:border-[var(--accent)] hover:text-white"
                }`}
              >
                {t} <span className="opacity-70">{n}</span>
              </button>
            ))}
          </div>
        </div>

        {view === "carousel" ? (
          <>
            <div
              ref={rail}
              onScroll={onScroll}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              onClickCapture={onClickCapture}
              className={`-mx-2 flex gap-5 overflow-x-auto px-2 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                dragging ? "cursor-grabbing" : "cursor-grab snap-x snap-mandatory"
              }`}
            >
              {shown.map((p, i) => (
                <Card
                  key={p.name}
                  p={p}
                  i={i}
                  onOpen={() => setOpenName(p.name)}
                  className="w-[82vw] max-w-sm shrink-0 snap-start sm:w-[21rem]"
                />
              ))}
            </div>

            {shown.length > 0 && (
              <div className="mt-2 flex items-center gap-4">
                <div className="h-0.5 flex-1 overflow-hidden rounded bg-white/10">
                  <div
                    className="h-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(8, progress * 100)}%` }}
                  />
                </div>
                <button
                  onClick={() => nudge(-1)}
                  aria-label="Scroll left"
                  className="h-9 w-9 rounded-full border border-white/20 text-white transition hover:border-[var(--accent)]"
                >
                  ←
                </button>
                <button
                  onClick={() => nudge(1)}
                  aria-label="Scroll right"
                  className="h-9 w-9 rounded-full border border-white/20 text-white transition hover:border-[var(--accent)]"
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="grid gap-5 py-2 sm:grid-cols-2">
            {shown.map((p, i) => (
              <Card key={p.name} p={p} i={i} onOpen={() => setOpenName(p.name)} />
            ))}
          </div>
        )}

        {shown.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-300">
            No projects match.{" "}
            <button
              onClick={() => {
                setQ("");
                setTag("All");
              }}
              className="text-pink-300 hover:underline"
            >
              Clear search and tag
            </button>
          </p>
        )}
      </div>

      <AnimatePresence>
        {current && (
          <>
            <motion.button
              key="backdrop"
              aria-label="Close details"
              onClick={() => setOpenName(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[69] cursor-default bg-black/70 backdrop-blur-sm"
            />
            <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center p-4">
              <motion.div
                key="dialog"
                role="dialog"
                aria-modal="true"
                aria-label={`${current.name} details`}
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                className="pointer-events-auto max-h-[85vh] w-[min(92vw,640px)] overflow-y-auto rounded-2xl border border-white/15 bg-[#070b14]/95 p-7 shadow-[0_0_60px_rgba(0,0,0,0.7)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {current.featured && (
                      <p className="mb-1 text-sm font-medium text-[var(--accent)]">Featured project</p>
                    )}
                    <h3 className="text-3xl font-extrabold text-white">{current.name}</h3>
                  </div>
                  <button
                    ref={closeRef}
                    onClick={() => setOpenName(null)}
                    aria-label="Close"
                    className="rounded border border-white/20 px-3 py-1 text-lg text-white hover:border-white"
                  >
                    ×
                  </button>
                </div>

                <p className="mt-5 text-base leading-relaxed text-slate-100">{current.description}</p>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {current.tags.map((t) => (
                    <li key={t}>
                      <button
                        onClick={() => {
                          setTag(t);
                          setOpenName(null);
                        }}
                        title={`Show only ${t} projects`}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100 transition hover:border-[var(--accent)] hover:text-white"
                      >
                        {t}
                      </button>
                    </li>
                  ))}
                </ul>

                {current.modules && current.modules.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-white">
                      What is inside ({current.modules.length} modules)
                    </h4>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {current.modules.map((m) => (
                        <li key={m.folder}>
                          <a
                            href={`${current.href}/tree/HEAD/${m.folder}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg border border-white/10 px-3 py-2 transition hover:border-[var(--accent)]"
                          >
                            <span className="block text-sm font-medium text-white">{m.label}</span>
                            {m.note && <span className="block text-xs text-slate-300">{m.note}</span>}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {[
                    ["Language", current.language ?? "–"],
                    ["Stars", typeof current.stars === "number" ? String(current.stars) : "–"],
                    ["Forks", typeof current.forks === "number" ? String(current.forks) : "–"],
                    ["Updated", current.pushed ? ago(current.pushed) : "–"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-white/10 px-3 py-2">
                      <dt className="text-xs text-slate-300">{k}</dt>
                      <dd className="font-semibold text-white">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href={current.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
                  >
                    Open on GitHub ↗
                  </a>
                  {current.href.includes("github.com") && (
                    <button
                      onClick={() => copy(`git clone ${current.href}.git`, "Clone command copied")}
                      className="rounded border border-white/25 px-4 py-2.5 text-sm text-white transition hover:border-[var(--accent)]"
                    >
                      Copy clone command
                    </button>
                  )}
                  <button
                    onClick={() => copy(current.href, "Link copied")}
                    className="rounded border border-white/25 px-4 py-2.5 text-sm text-white transition hover:border-[var(--accent)]"
                  >
                    Copy link
                  </button>
                </div>

                {shown.length > 1 && (
                  <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-300">
                    <button onClick={() => step(-1)} className="hover:text-white">
                      ← Previous
                    </button>
                    <span>
                      {idx + 1} / {shown.length} · use the arrow keys
                    </span>
                    <button onClick={() => step(1)} className="hover:text-white">
                      Next →
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded border border-white/30 bg-black/90 px-4 py-2 text-sm text-white shadow-[0_0_30px_rgba(34,211,238,0.2)]">
          {toast}
        </div>
      )}
    </SplitSection>
  );
}
