"use client";

import SplitSection from "@/components/SplitSection";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as RMouseEvent, PointerEvent as RPointerEvent } from "react";
import { motion } from "framer-motion";
import { PROJECTS, CONTACT } from "@/data/content";

type Item = {
  name: string;
  description: string;
  tags: string[];
  href: string;
  stars?: number;
  synced?: boolean;
};

type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  html_url: string;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
};

const user = CONTACT.github.replace(/\/+$/, "").split("/").pop() ?? "";

export default function Projects() {
  const [repos, setRepos] = useState<Item[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [tag, setTag] = useState("All");
  const [q, setQ] = useState("");

  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, moved: false, x: 0, left: 0 });
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  // pull your public repos live from GitHub
  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=30`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Repo[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setRepos(
          data
            .filter((r) => !r.fork && !r.archived && r.name !== "my-portfolio")
            .map((r) => ({
              name: r.name,
              description: r.description ?? "No description yet.",
              tags: [r.language, ...(r.topics ?? []).slice(0, 3)].filter(Boolean) as string[],
              href: r.html_url,
              stars: r.stargazers_count,
              synced: true,
            }))
        );
        setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // your hand-written projects first, then any extra GitHub repos
  const items = useMemo(() => {
    const manual: Item[] = PROJECTS.map((p) => ({ ...p }));
    const names = new Set(manual.map((p) => p.name.toLowerCase()));
    return [...manual, ...repos.filter((r) => !names.has(r.name.toLowerCase()))];
  }, [repos]);

  const tags = useMemo(() => {
    const count = new Map<string, number>();
    items.forEach((i) => i.tags.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
    return [
      "All",
      ...[...count.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([t]) => t),
    ];
  }, [items]);

  const shown = items.filter(
    (i) =>
      (tag === "All" || i.tags.includes(tag)) &&
      `${i.name} ${i.description} ${i.tags.join(" ")}`
        .toLowerCase()
        .includes(q.trim().toLowerCase())
  );

  const onScroll = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }, []);

  // back to the first card whenever the filter or search changes
  useEffect(() => {
    rail.current?.scrollTo({ left: 0 });
    const t = setTimeout(onScroll, 50);
    return () => clearTimeout(t);
  }, [tag, q, onScroll]);

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
  // a drag must not count as a click on a card link
  const onClickCapture = (e: RMouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const nudge = (dir: number) =>
    rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <SplitSection id="projects">
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search projects..."
            aria-label="Search projects"
            className="w-full max-w-xs rounded border border-white/20 bg-black/60 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
          />
          <span className="text-xs text-slate-300">
            {status === "loading" && "syncing with GitHub..."}
            {status === "ok" && `${repos.length} public repos synced from GitHub`}
            {status === "error" && "GitHub sync unavailable, showing saved projects"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                tag === t
                  ? "border-cyan-300 bg-cyan-300 text-black"
                  : "border-white/20 text-slate-200 hover:border-cyan-300 hover:text-cyan-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

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
          <motion.a
            key={p.name}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05 }}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            className="tile group flex w-[82vw] max-w-sm shrink-0 snap-start select-none flex-col p-6 sm:w-80"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-200">{p.name}</h3>
              <span className="flex shrink-0 items-center gap-2 text-xs text-slate-300">
                {p.synced && <span title="synced from GitHub">● live</span>}
                {typeof p.stars === "number" && p.stars > 0 && <span>★ {p.stars}</span>}
              </span>
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-200">{p.description}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <li
                  key={t}
                  className="rounded border border-white/15 px-2 py-0.5 text-xs text-slate-200"
                >
                  {t}
                </li>
              ))}
            </ul>
          </motion.a>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-300">
          No projects match. Clear the search or pick another tag.
        </p>
      ) : (
        <div className="mt-2 flex items-center gap-4">
          <div className="h-0.5 flex-1 overflow-hidden rounded bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-300 to-violet-400"
              style={{ width: `${Math.max(8, progress * 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-300">{shown.length} projects</span>
          <button
            onClick={() => nudge(-1)}
            aria-label="Scroll left"
            className="h-9 w-9 rounded-full border border-white/20 text-white transition hover:border-cyan-300 hover:text-cyan-200"
          >
            ←
          </button>
          <button
            onClick={() => nudge(1)}
            aria-label="Scroll right"
            className="h-9 w-9 rounded-full border border-white/20 text-white transition hover:border-cyan-300 hover:text-cyan-200"
          >
            →
          </button>
        </div>
      )}
    </SplitSection>
  );
}
