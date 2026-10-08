const ORDER = ["about", "experience", "education", "skills", "projects", "contact"];

export default function SectionTitle({ label }: { label: string }) {
  const n = String(ORDER.indexOf(label) + 1).padStart(2, "0");
  return (
    <div className="mb-10 flex select-none items-end gap-4">
      <span className="text-stroke text-6xl font-extrabold leading-none text-transparent md:text-8xl">
        {n}
      </span>
      <div className="pb-1 md:pb-3">
        <p className="text-[10px] tracking-[0.3em] text-cyan-300 md:text-xs">// SECTION</p>
        <h2 className="bg-gradient-to-r from-white via-green-200 to-emerald-400 bg-clip-text text-3xl font-extrabold uppercase tracking-wide text-transparent drop-shadow-[0_0_14px_rgba(0,255,156,0.4)] md:text-5xl">
          {label}
        </h2>
      </div>
    </div>
  );
}
