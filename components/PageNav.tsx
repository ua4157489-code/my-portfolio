"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { PAGES } from "@/data/pages";

// previous / next page cards at the bottom of every section page
export default function PageNav() {
  const current = usePathname().split("/")[1] ?? "";
  const i = PAGES.findIndex((p) => p.id === current);
  if (i < 0) return null;

  const prev = i > 0 ? PAGES[i - 1] : null;
  const next = i < PAGES.length - 1 ? PAGES[i + 1] : null;

  const card = (href: string, hint: string, title: string, sub: string, accent: string, right = false) => (
    <Link
      href={href}
      style={{ "--accent": accent } as CSSProperties}
      className={`tile group block p-6 ${right ? "sm:text-right" : ""}`}
    >
      <span className="text-sm text-slate-300">{hint}</span>
      <span className="mt-1 block text-2xl font-extrabold text-white transition group-hover:text-[var(--accent)]">
        {title}
      </span>
      <span className="mt-1 block text-sm text-slate-300">{sub}</span>
    </Link>
  );

  return (
    <nav aria-label="Page navigation" className="relative z-10 mx-auto grid max-w-7xl gap-4 px-6 pb-20 sm:grid-cols-2">
      {prev ? card(`/${prev.id}`, "Previous page", `← ${prev.label}`, prev.kicker, prev.accent) : <span />}
      {next
        ? card(`/${next.id}`, "Next page", `${next.label} →`, next.kicker, next.accent, true)
        : card("/", "That is everything", "Back to home →", "Start again from the top", "#22d3ee", true)}
    </nav>
  );
}
