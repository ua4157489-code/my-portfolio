"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SplitSection from "@/components/SplitSection";
import CountUp from "@/components/CountUp";
import SkillDetail from "@/components/SkillDetail";
import { accentOf } from "@/components/skillColors";
import { SKILL_GROUPS, FLAT, SOURCES, dotOf } from "@/data/skills";

type View = "grid" | "list";
type Sort = "default" | "az" | "places";

const tab = (on: boolean) =>
  "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition " +
  (on
    ? "border-cyan-300 bg-cyan-300 font-semibold text-black"
    : "border-white/20 text-slate-200 hover:border-cyan-300 hover:text-white");

const shortOf = (id: string) => SOURCES.find((x) => x.id === id)?.short ?? id;

export default function Skills() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const [source, setSource] = useState("All");
  const [sort, setSort] = useState<Sort>("default");
  const [view, setView] = useState<View>("grid");
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // remember the chosen view
  useEffect(() => {
    try {
      const v = localStorage.getItem("skills-view");
      if (v === "grid" || v === "list") setView(v);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem("skills-view", v);
    } catch {
      /* storage unavailable */
    }
  };

  // Esc closes the drawer; "/" focuses search while the Skills section is on screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickedName(null);
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
  }, []);

  const query = q.trim().toLowerCase();
  const visible = FLAT.filter(
    (s) =>
      (group === "All" || s.group === group) &&
      (source === "All" || s.sources.includes(source)) &&
      (!query || `${s.name} ${s.group} ${s.sources.join(" ")}`.toLowerCase().includes(query))
  ).sort((a, b) =>
    sort === "az"
      ? a.name.localeCompare(b.name)
      : sort === "places"
        ? b.sources.length - a.sources.length || a.name.localeCompare(b.name)
        : 0
  );

  const groups = SKILL_GROUPS.map((g) => ({
    ...g,
    skills: visible.filter((s) => s.group === g.group),
  })).filter((g) => g.skills.length > 0);

  const filtered = group !== "All" || source !== "All" || query !== "";
  const pickedSkill = FLAT.find((s) => s.name === pickedName) ?? null;
  const clear = () => {
    setQ("");
    setGroup("All");
    setSource("All");
  };

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(visible.map((s) => s.name).join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const stats = [
    { label: "skills", value: FLAT.length },
    { label: "categories", value: SKILL_GROUPS.length },
    { label: "places learned or used", value: SOURCES.length },
    {
      label: "used at Tkxel",
      value: FLAT.filter((s) => s.sources.includes(SOURCES[0].id)).length,
    },
  ];

  const ctl =
    "rounded border border-white/20 bg-black/60 px-3 py-2 text-xs text-slate-100 transition hover:border-cyan-300 focus:border-cyan-300 focus:outline-none";

  return (
    <SplitSection id="skills">
      <div ref={wrapRef}>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((st) => (
            <div key={st.label} className="tile p-4 text-center">
              <CountUp to={st.value} className="text-3xl font-bold text-white" />
              <p className="mt-1 text-xs text-slate-300">{st.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="search skills, categories, places..."
              aria-label="Search skills"
              className="w-full rounded border border-white/20 bg-black/60 px-4 py-2 pr-10 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/20 px-1.5 text-[10px] text-slate-300 sm:block">
              /
            </kbd>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort skills"
            className={ctl}
          >
            <option value="default">Sort: my order</option>
            <option value="az">Sort: A to Z</option>
            <option value="places">Sort: used in most places</option>
          </select>

          <div className="flex overflow-hidden rounded border border-white/20" role="group" aria-label="View">
            {(["grid", "list"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => changeView(v)}
                aria-pressed={view === v}
                className={`px-3 py-2 text-xs transition ${
                  view === v ? "bg-cyan-300 font-semibold text-black" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {v === "grid" ? "Grouped" : "List"}
              </button>
            ))}
          </div>

          <button onClick={copyList} className={ctl}>
            {copied ? "Copied" : "Copy list"}
          </button>
        </div>

        <div className="mb-3 flex items-center gap-4 text-xs text-slate-300" aria-live="polite">
          <span>
            Showing {visible.length} of {FLAT.length} skills
          </span>
          {filtered && (
            <button onClick={clear} className="text-pink-300 hover:underline">
              Clear filters
            </button>
          )}
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {[{ group: "All", n: FLAT.length }, ...SKILL_GROUPS.map((g) => ({ group: g.group, n: g.skills.length }))].map(
            (g) => (
              <button key={g.group} onClick={() => setGroup(g.group)} className={tab(group === g.group)}>
                {g.group} <span className="opacity-70">{g.n}</span>
              </button>
            )
          )}
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-300">Used at:</span>
          <button onClick={() => setSource("All")} className={tab(source === "All")}>
            All
          </button>
          {SOURCES.map((src) => (
            <button
              key={src.id}
              onClick={() => setSource(src.id)}
              title={src.id}
              className={tab(source === src.id) + " flex items-center gap-2"}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${src.dot}`} />
              {src.short}{" "}
              <span className="opacity-70">{FLAT.filter((s) => s.sources.includes(src.id)).length}</span>
            </button>
          ))}
        </div>

        {view === "grid" ? (
          <motion.div layout className="grid gap-5 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {groups.map((g) => (
                <motion.div
                  key={g.group}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ "--ac": accentOf(g.group) } as CSSProperties}
                  className="tile p-5"
                >
                  <span className="absolute inset-x-0 top-0 h-0.5 bg-[var(--ac)]" />
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-bold text-white">
                      <span>{g.icon}</span>
                      {g.group}
                    </h3>
                    <span className="text-xs text-slate-300">
                      {g.skills.length} of {SKILL_GROUPS.find((x) => x.group === g.group)?.skills.length}
                    </span>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {g.skills.map((s) => (
                      <li key={s.name}>
                        <button
                          onClick={() => setPickedName(s.name)}
                          className={
                            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition " +
                            (pickedName === s.name
                              ? "border-[var(--ac)] bg-[var(--ac)] font-semibold text-black"
                              : s.sources.includes(SOURCES[0].id)
                                ? "border-pink-400/60 bg-pink-500/10 text-white hover:border-[var(--ac)]"
                                : "border-white/20 bg-black/40 text-slate-100 hover:border-[var(--ac)] hover:text-white")
                          }
                        >
                          {s.name}
                          <span className="flex gap-0.5">
                            {s.sources.slice(0, 3).map((id) => (
                              <span key={id} className={`h-1.5 w-1.5 rounded-full ${dotOf(id)}`} />
                            ))}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          visible.length > 0 && (
            <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {visible.map((s) => (
                <li key={s.name}>
                  <button
                    onClick={() => setPickedName(s.name)}
                    style={{ "--ac": accentOf(s.group) } as CSSProperties}
                    className={`grid w-full grid-cols-1 items-center gap-2 px-4 py-3 text-left transition hover:bg-white/5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,2fr)] sm:gap-4 ${
                      pickedName === s.name ? "bg-white/10" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium text-white">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--ac)]" />
                      {s.name}
                    </span>
                    <span className="text-sm text-slate-300">
                      {s.icon} {s.group}
                    </span>
                    <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-200">
                      {s.sources.length === 0 ? (
                        <span className="text-slate-400">no place listed</span>
                      ) : (
                        s.sources.map((id) => (
                          <span key={id} className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${dotOf(id)}`} />
                            {shortOf(id)}
                          </span>
                        ))
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}

        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-300">
            No skills match.{" "}
            <button onClick={clear} className="text-pink-300 hover:underline">
              Clear filters
            </button>
          </p>
        )}

        {view === "grid" && visible.length > 0 && (
          <p className="mt-6 text-xs text-slate-300">
            Pink outline: used at Tkxel. Dots show the other places a skill was used or learned. Click any
            skill for details.
          </p>
        )}
      </div>

      <AnimatePresence>
        {pickedSkill && (
          <SkillDetail
            key={pickedSkill.name}
            skill={pickedSkill}
            onClose={() => setPickedName(null)}
            onPick={(name) => setPickedName(name)}
            onSource={(id) => {
              setSource(id);
              setGroup("All");
              setPickedName(null);
            }}
            onGroup={(g) => {
              setGroup(g);
              setSource("All");
              setPickedName(null);
            }}
          />
        )}
      </AnimatePresence>
    </SplitSection>
  );
}
