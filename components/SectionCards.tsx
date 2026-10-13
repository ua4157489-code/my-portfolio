import Link from "next/link";
import type { CSSProperties } from "react";
import { PAGES } from "@/data/pages";

// the home page: one card per section page
export default function SectionCards() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">Explore</h2>
      <p className="mt-3 max-w-xl text-base text-slate-300">
        Every part of my portfolio has its own page. Pick one to open it.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PAGES.map((p) => (
          <Link
            key={p.id}
            href={`/${p.id}`}
            style={{ "--accent": p.accent } as CSSProperties}
            className="tile group block p-7"
          >
            <span className="absolute inset-x-0 top-0 h-0.5 bg-[var(--accent)]" />
            <span className="text-sm font-medium text-[var(--accent)]">{p.kicker}</span>
            <span className="mt-2 block text-3xl font-extrabold text-white">{p.label}</span>
            <span className="mt-3 block text-sm leading-relaxed text-slate-300">{p.blurb}</span>
            <span className="mt-6 block text-sm font-semibold text-white transition group-hover:text-[var(--accent)]">
              Open page →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
