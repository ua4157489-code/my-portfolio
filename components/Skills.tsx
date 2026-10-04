"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CountUp from "@/components/CountUp";
import SkillDetail from "@/components/SkillDetail";
import { SKILL_GROUPS, FLAT, SOURCES, dotOf } from "@/data/skills";

const tab = (on: boolean) =>
  "whitespace-nowrap rounded-full border px-3 py-1 text-xs transition " +
  (on
    ? "border-green-400 bg-green-400 text-black"
    : "border-green-900 text-green-500 hover:border-green-400 hover:text-green-300");

export default function Skills() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const [source, setSource] = useState("All");
  const [pickedName, setPickedName] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickedName(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const query = q.trim().toLowerCase();
  const groups = SKILL_GROUPS.map((g) => ({
    ...g,
    skills: g.skills.filter(
      (s) =>
        (group === "All" || g.group === group) &&
        (source === "All" || s.sources.includes(source)) &&
        (!query || (s.name + " " + s.sources.join(" ")).toLowerCase().includes(query))
    ),
  })).filter((g) => g.skills.length > 0);

  const shown = groups.reduce((n, g) => n + g.skills.length, 0);
  const filtered = group !== "All" || source !== "All" || query !== "";
  const pickedSkill = FLAT.find((s) => s.name === pickedName) ?? null;
  const clear = () => {
    setQ("");
    setGroup("All");
    setSource("All");
  };

  const stats = [
    { label: "skills", value: FLAT.length },
    { label: "categories", value: SKILL_GROUPS.length },
    {
      label: "used at Tkxel",
      value: FLAT.filter((s) => s.sources.includes(SOURCES[0].id)).length,
    },
  ];

  return (
    <section id="skills" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <h2 className="glow mb-8 text-3xl font-bold text-green-400">
        <span className="text-green-700">$ </span>skills
      </h2>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {stats.map((st) => (
          <div
            key={st.label}
            className="rounded-xl border border-green-900 bg-black/60 p-4 text-center"
          >
            <CountUp to={st.value} className="text-3xl font-bold text-green-300" />
            <p className="mt-1 text-xs text-cyan-300/80">{st.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search skills or where I used them..."
          className="w-full max-w-sm rounded border border-green-900 bg-black/60 px-4 py-2 text-sm text-green-100 placeholder:text-green-800 focus:border-green-400 focus:outline-none"
        />
        <span className="text-xs text-cyan-300/80">
          {shown} of {FLAT.length} skills
        </span>
        {filtered && (
          <button onClick={clear} className="text-xs text-pink-400 hover:underline">
            clear filters
          </button>
        )}
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {["All", ...SKILL_GROUPS.map((g) => g.group)].map((g) => (
          <button key={g} onClick={() => setGroup(g)} className={tab(group === g)}>
            {g}
          </button>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs text-green-700">used at:</span>
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
            {src.short}
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-5 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {groups.map((g) => (
            <motion.div
              key={g.group}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-green-900 bg-black/60 p-5 backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-green-300">
                  <span>{g.icon}</span>
                  {g.group}
                </h3>
                <span className="text-xs text-cyan-300/80">{g.skills.length}</span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {g.skills.map((s) => (
                  <li key={s.name}>
                    <button
                      onClick={() => setPickedName(s.name)}
                      className={
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition " +
                        (pickedName === s.name
                          ? "border-green-400 bg-green-400 text-black"
                          : s.sources.includes(SOURCES[0].id)
                            ? "border-pink-500/50 bg-pink-500/5 text-green-200 hover:border-pink-400"
                            : "border-green-900 bg-black/50 text-green-300 hover:border-green-400 hover:text-green-100")
                      }
                    >
                      {s.name}
                      <span className="flex gap-0.5">
                        {s.sources.slice(0, 3).map((id) => (
                          <span
                            key={id}
                            className={`h-1.5 w-1.5 rounded-full ${dotOf(id)}`}
                          />
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

      {groups.length === 0 && (
        <p className="py-10 text-center text-sm text-green-700">
          No skills match. <button onClick={clear} className="text-pink-400 hover:underline">Clear filters</button>
        </p>
      )}

      <AnimatePresence>
        {pickedSkill && (
          <SkillDetail
            key={pickedSkill.name}
            skill={pickedSkill}
            onClose={() => setPickedName(null)}
            onPick={(name) => setPickedName(name)}
            onSource={(id) => {
              setSource(id);
              setPickedName(null);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
