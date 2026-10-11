import { FLAT } from "@/data/skills";

const names = FLAT.map((s) => s.name);

function Row({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const row = [...items, ...items];
  return (
    <div className="vel-skew overflow-hidden">
      <div
        className="marquee flex w-max items-center gap-10 whitespace-nowrap"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {row.map((n, i) => (
          <span key={i} className="flex items-center gap-10">
            {n}
            <span className="text-acc-2/70">&#9670;</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  const half = Math.ceil(names.length / 2);
  return (
    <div className="relative z-10 space-y-3 border-y border-white/10 bg-black/65 py-5 font-mono text-sm text-slate-200 backdrop-blur-sm">
      <Row items={names.slice(0, half)} />
      <Row items={names.slice(half)} reverse />
    </div>
  );
}
