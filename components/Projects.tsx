"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

  return (
    <section id="projects" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <h2 className="glow mb-6 text-3xl font-bold text-green-400">
        <span className="text-green-700">$ </span>projects
      </h2>

      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search projects..."
            className="w-full max-w-xs rounded border border-green-900 bg-black/60 px-4 py-2 text-sm text-green-100 placeholder:text-green-800 focus:border-green-400 focus:outline-none"
          />
          <span className="text-xs text-cyan-300/80">
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
                  ? "border-green-400 bg-green-400 text-black"
                  : "border-green-900 text-green-500 hover:border-green-400 hover:text-green-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="grid gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {shown.map((p) => (
            <motion.a
              key={p.name}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded border border-green-900 bg-black/60 p-6 transition hover:border-green-400 hover:shadow-[0_0_25px_rgba(0,255,156,0.2)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold text-green-300 group-hover:text-green-400">
                  {p.name}
                </h3>
                <span className="flex shrink-0 items-center gap-2 text-xs text-cyan-300/80">
                  {p.synced && <span title="synced from GitHub">● live</span>}
                  {typeof p.stars === "number" && p.stars > 0 && <span>★ {p.stars}</span>}
                </span>
              </div>
              <p className="mt-3 text-sm text-green-500">{p.description}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li
                    key={t}
                    className="rounded border border-green-900 px-2 py-0.5 text-xs text-green-600"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </motion.a>
          ))}
        </AnimatePresence>
      </motion.div>

      {shown.length === 0 && (
        <p className="py-10 text-center text-sm text-green-700">No projects match.</p>
      )}
    </section>
  );
}
