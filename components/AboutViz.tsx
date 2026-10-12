"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { SKILL_GROUPS, SOURCES } from "@/data/skills";

const PALETTE = [
  "#22d3ee", "#a78bfa", "#ff4d9d", "#fbbf24", "#2dd4bf",
  "#fb923c", "#e879f9", "#38bdf8", "#fb7185", "#a3e635",
];

type G = { group: string; count: number; color: string };

// 0 -> 1 over about a second and a half, starting when `go` turns true
function useGrow(go: boolean) {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!go) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1400, 1);
      setK(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [go]);
  return k;
}

const short = (label: string) => label.split(/[,&]/)[0].trim();

/* ---------- radar: how many skills are listed in each area ---------- */
function Radar({ groups, k }: { groups: G[]; k: number }) {
  const [active, setActive] = useState<number | null>(null);
  const n = groups.length;
  const max = Math.max(...groups.map((g) => g.count), 1);
  const C = 200;
  const R = 135;

  const pt = (i: number, f: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [C + Math.cos(a) * R * f, C + Math.sin(a) * R * f];
  };
  const ring = (f: number) => groups.map((_, i) => pt(i, f).join(",")).join(" ");
  const level = (g: G) => (0.12 + 0.88 * (g.count / max)) * k;
  const data = groups.map((g, i) => pt(i, level(g)).join(",")).join(" ");
  const on = active === null ? null : groups[active];

  return (
    <svg
      viewBox="0 0 400 410"
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label="Radar chart of how many skills I list in each area"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="rgba(255,255,255,0.12)" />
      ))}
      {groups.map((g, i) => {
        const [x, y] = pt(i, 1);
        return (
          <line
            key={g.group}
            x1={C}
            y1={C}
            x2={x}
            y2={y}
            stroke={active === i ? g.color : "rgba(255,255,255,0.12)"}
          />
        );
      })}

      <polygon
        points={data}
        fill="rgba(34,211,238,0.18)"
        stroke="#22d3ee"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {groups.map((g, i) => {
        const [x, y] = pt(i, level(g));
        return (
          <circle
            key={g.group}
            cx={x}
            cy={y}
            r={active === i ? 8 : 5.5}
            fill={g.color}
            stroke="#04050b"
            strokeWidth="2"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(i)}
            className="cursor-pointer transition-all"
          />
        );
      })}

      {groups.map((g, i) => {
        const [x, y] = pt(i, 1.2);
        const anchor = x < C - 10 ? "end" : x > C + 10 ? "start" : "middle";
        return (
          <text
            key={g.group}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="12"
            fill={active === i ? "#ffffff" : "#cbd5e1"}
            fontWeight={active === i ? 700 : 400}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className="cursor-pointer"
          >
            {short(g.group)}
          </text>
        );
      })}

      <text x={C} y={398} textAnchor="middle" fontSize="13" fill={on ? on.color : "#94a3b8"}>
        {on ? on.group + ": " + on.count + " skills" : "Hover a dot to see an area"}
      </text>
    </svg>
  );
}

/* ---------- stacked bars: where each skill was used or learned ---------- */
function Bars({ k }: { k: number }) {
  const rows = SOURCES.map((src) => {
    const segs = SKILL_GROUPS.map((g, gi) => ({
      name: g.group,
      color: PALETTE[gi % PALETTE.length],
      count: g.skills.filter((s) => s.sources.includes(src.id)).length,
    })).filter((s) => s.count > 0);
    return { src, segs, total: segs.reduce((a, s) => a + s.count, 0) };
  }).filter((r) => r.total > 0);

  const maxTotal = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="space-y-5">
      {rows.map((r) => (
        <div key={r.src.id}>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-100">
              <span className={"h-2 w-2 rounded-full " + r.src.dot} />
              {r.src.short}
            </span>
            <span className="text-slate-400">{r.total} skills</span>
          </div>
          <div className="h-3 rounded-full bg-white/5">
            <div
              className="flex h-full overflow-hidden rounded-full"
              style={{ width: (r.total / maxTotal) * 100 * k + "%" }}
            >
              {r.segs.map((s) => (
                <span
                  key={s.name}
                  title={s.name + ": " + s.count}
                  style={{ flex: s.count, background: s.color }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AboutViz() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const k = useGrow(inView);

  const groups: G[] = SKILL_GROUPS.map((g, i) => ({
    group: g.group,
    count: g.skills.length,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <div ref={ref}>
      <h3 className="text-2xl font-bold text-white">Skills at a glance</h3>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        The chart counts how many skills I list in each area. It shows coverage, not a score of
        how good I am at each one.
      </p>

      <div className="mt-10 grid items-center gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <Radar groups={groups} k={k} />
        <div>
          <h4 className="mb-5 text-lg font-semibold text-white">Where I used them</h4>
          <Bars k={k} />
        </div>
      </div>

      <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
        {groups.map((g) => (
          <li key={g.group} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} />
            {g.group}
          </li>
        ))}
      </ul>
    </div>
  );
}
