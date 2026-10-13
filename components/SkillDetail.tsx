"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FLAT, SOURCES, dotOf } from "@/data/skills";
import type { FlatSkill } from "@/data/skills";
import { accentOf } from "@/components/skillColors";

export default function SkillDetail({
  skill,
  onClose,
  onPick,
  onSource,
  onGroup,
}: {
  skill: FlatSkill;
  onClose: () => void;
  onPick: (name: string) => void;
  onSource: (id: string) => void;
  onGroup: (group: string) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const accent = accentOf(skill.group);
  const sameGroup = FLAT.filter((s) => s.name !== skill.name && s.group === skill.group).slice(0, 8);
  const alongside = FLAT.filter(
    (s) =>
      s.name !== skill.name &&
      s.group !== skill.group &&
      s.sources.some((id) => skill.sources.includes(id))
  ).slice(0, 8);

  const chip =
    "rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100 transition hover:border-white hover:text-white";

  return (
    <>
      <motion.button
        aria-label="Close details"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[69] cursor-default bg-black/60 backdrop-blur-[2px]"
      />
      <motion.aside
        role="dialog"
        aria-label={`${skill.name} details`}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        style={{ borderLeftColor: accent }}
        className="fixed right-0 top-0 z-[70] flex h-full w-[min(92vw,420px)] flex-col overflow-y-auto border-l-2 bg-[#070b14]/95 p-6 shadow-[-20px_0_60px_rgba(0,0,0,0.6)] backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: accent }}>
              {skill.icon} {skill.group}
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-white">{skill.name}</h3>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="rounded border border-white/20 px-3 py-1 text-lg text-white hover:border-white"
          >
            ×
          </button>
        </div>

        <button
          onClick={() => onGroup(skill.group)}
          className="mt-4 self-start rounded border px-3 py-1 text-xs text-white transition hover:bg-white/10"
          style={{ borderColor: accent }}
        >
          Show only {skill.group}
        </button>

        <h4 className="mt-8 text-sm font-semibold text-white">Where I used it</h4>
        {skill.sources.length === 0 ? (
          <p className="mt-2 text-sm text-slate-300">No specific source listed for this skill.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {skill.sources.map((id) => {
              const n = FLAT.filter((s) => s.sources.includes(id)).length;
              const short = SOURCES.find((x) => x.id === id)?.short ?? id;
              return (
                <li key={id}>
                  <button
                    onClick={() => onSource(id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-white/40"
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotOf(id)}`} />
                    <span className="flex-1">
                      <span className="block font-medium text-white">{short}</span>
                      <span className="block text-xs text-slate-300">
                        {n} skill{n === 1 ? "" : "s"} · show them
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {sameGroup.length > 0 && (
          <>
            <h4 className="mt-8 text-sm font-semibold text-white">More in {skill.group}</h4>
            <ul className="mt-3 flex flex-wrap gap-2">
              {sameGroup.map((r) => (
                <li key={r.name}>
                  <button onClick={() => onPick(r.name)} className={chip}>
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {alongside.length > 0 && (
          <>
            <h4 className="mt-8 text-sm font-semibold text-white">Used in the same places</h4>
            <ul className="mt-3 flex flex-wrap gap-2">
              {alongside.map((r) => (
                <li key={r.name}>
                  <button onClick={() => onPick(r.name)} className={chip}>
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </motion.aside>
    </>
  );
}
