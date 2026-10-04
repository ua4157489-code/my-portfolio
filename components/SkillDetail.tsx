"use client";

import { motion } from "framer-motion";
import { FLAT, dotOf } from "@/data/skills";
import type { FlatSkill } from "@/data/skills";

export default function SkillDetail({
  skill,
  onClose,
  onPick,
  onSource,
}: {
  skill: FlatSkill;
  onClose: () => void;
  onPick: (name: string) => void;
  onSource: (id: string) => void;
}) {
  const related = FLAT.filter(
    (s) => s.name !== skill.name && s.sources.some((id) => skill.sources.includes(id))
  ).slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-x-0 bottom-24 z-[64] mx-auto w-[min(94vw,560px)] rounded-xl border border-green-400/40 bg-black/90 p-5 font-mono shadow-[0_0_50px_rgba(0,255,156,0.2)] backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest text-cyan-300">
            {skill.icon} {skill.group}
          </p>
          <h3 className="mt-1 text-xl font-bold text-green-300">{skill.name}</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded border border-green-900 px-2 text-green-400 hover:border-green-400"
        >
          ×
        </button>
      </div>

      <p className="mt-4 text-xs tracking-widest text-green-600">$ where I used it</p>
      {skill.sources.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">No specific source listed.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {skill.sources.map((id) => (
            <li key={id}>
              <button
                onClick={() => onSource(id)}
                className="flex items-center gap-2 text-left text-sm text-green-200 hover:text-white"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotOf(id)}`} />
                {id}
              </button>
            </li>
          ))}
        </ul>
      )}

      {related.length > 0 && (
        <>
          <p className="mt-4 text-xs tracking-widest text-green-600">$ related skills</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={r.name}>
                <button
                  onClick={() => onPick(r.name)}
                  className="rounded-full border border-green-900 px-3 py-1 text-xs text-green-300 transition hover:border-green-400"
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </motion.div>
  );
}
