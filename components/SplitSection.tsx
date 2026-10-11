import type { ReactNode } from "react";

const META: Record<string, { label: string; kicker: string }> = {
  about: { label: "About", kicker: "who I am" },
  experience: { label: "Experience", kicker: "where I have worked" },
  education: { label: "Education", kicker: "where I studied" },
  skills: { label: "Skills", kicker: "what I can do" },
  projects: { label: "Projects", kicker: "what I have built" },
  contact: { label: "Contact", kicker: "let's talk" },
};
const ORDER = Object.keys(META);

export default function SplitSection({ id, children }: { id: string; children: ReactNode }) {
  const meta = META[id] ?? { label: id, kicker: "" };
  const n = String(ORDER.indexOf(id) + 1).padStart(2, "0");

  return (
    <section
      id={id}
      className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14"
    >
      <aside className="mb-10 select-none lg:sticky lg:top-28 lg:mb-0 lg:self-start">
        <span className="text-stroke block text-7xl font-extrabold leading-none text-transparent lg:text-8xl">
          {n}
        </span>
        <h2 className="mt-3 bg-gradient-to-r from-white via-green-200 to-emerald-400 bg-clip-text text-3xl font-extrabold uppercase tracking-wide text-transparent drop-shadow-[0_0_14px_rgba(0,255,156,0.4)] lg:text-4xl">
          {meta.label}
        </h2>
        <p className="mt-2 text-xs tracking-[0.3em] text-cyan-300">// {meta.kicker}</p>
        <span className="mt-5 block h-px w-24 bg-gradient-to-r from-green-400 to-transparent" />
      </aside>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
