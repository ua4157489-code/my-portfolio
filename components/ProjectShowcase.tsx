"use client";

import { useRef } from "react";
import type { ReactNode, PointerEvent as RPointerEvent } from "react";
import Link from "next/link";
import { Section, Heading } from "@/components/HomeKit";
import Reveal from "@/components/Reveal";
import { PROJECTS } from "@/data/content";

// the card leans toward your mouse and a light follows it
function Tilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg)`;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className="tilt-card h-full transition-transform duration-200 ease-out"
    >
      {children}
    </div>
  );
}

export default function ProjectShowcase() {
  return (
    <Section id="home-projects" side="center" wide>
      <Heading kicker="What I have built" title="Featured projects" text="Open one to see it on GitHub, or browse them all." />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {PROJECTS.map((p, i) => {
          const modules = (p as unknown as { modules?: { label: string }[] }).modules ?? [];
          return (
            <Reveal key={p.name} delay={0.1 * i} className="h-full">
              <Tilt>
                <div className="tile tilt-glare flex h-full flex-col p-7">
                  <span className="stroke-text text-6xl font-black">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-2xl font-extrabold text-white">{p.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-200">{p.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <li key={t} className="rounded border border-white/15 px-2 py-0.5 text-xs text-slate-200">
                        {t}
                      </li>
                    ))}
                  </ul>
                  {modules.length > 0 && (
                    <p className="mt-4 text-xs text-slate-300">
                      Inside: {modules.slice(0, 6).map((m) => m.label).join(", ")}
                      {modules.length > 6 ? ` and ${modules.length - 6} more` : ""}
                    </p>
                  )}
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-block text-sm font-semibold text-cyan-300 transition hover:text-white"
                  >
                    View on GitHub ↗
                  </a>
                </div>
              </Tilt>
            </Reveal>
          );
        })}
      </div>
      <Link href="/projects" className="mt-10 inline-block text-sm font-semibold text-cyan-300 transition hover:text-white">
        See all projects, with live numbers →
      </Link>
    </Section>
  );
}
