"use client";

import { useEffect, useState } from "react";
import { Section, Heading } from "@/components/HomeKit";
import { CONTACT } from "@/data/content";

type Repo = {
  name: string;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  html_url: string;
  fork: boolean;
  archived: boolean;
};
type Gh = { repos: Repo[]; followers: number; total: number };

const user = CONTACT.github.replace(/\/+$/, "").split("/").pop() ?? "";
const KEY = "gh-live-v1";
const PALETTE = ["#22d3ee", "#a78bfa", "#ff4d9d", "#fbbf24", "#34d399", "#60a5fa"];

const ago = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "today";
  if (d < 30) return `${Math.floor(d)}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

// real numbers from the GitHub API, cached for 10 minutes
export default function GithubLive() {
  const [gh, setGh] = useState<Gh | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const c = JSON.parse(raw) as { t: number; data: Gh };
        if (Date.now() - c.t < 600000) {
          setGh(c.data);
          setState("ok");
          return;
        }
      }
    } catch {
      /* ignore a bad cache */
    }
    Promise.all([
      fetch(`https://api.github.com/users/${user}`).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<{ followers: number; public_repos: number }>;
      }),
      fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=30`).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Repo[]>;
      }),
    ])
      .then(([u, repos]) => {
        if (cancelled) return;
        const data: Gh = { repos, followers: u.followers, total: u.public_repos };
        setGh(data);
        setState("ok");
        try {
          localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), data }));
        } catch {
          /* storage unavailable */
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const own = gh ? gh.repos.filter((r) => !r.fork && !r.archived) : [];
  const stars = own.reduce((n, r) => n + r.stargazers_count, 0);
  const langs = new Map<string, number>();
  own.forEach((r) => r.language && langs.set(r.language, (langs.get(r.language) ?? 0) + 1));
  const langList = [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const langTotal = langList.reduce((n, [, c]) => n + c, 0);

  const stats = gh
    ? [
        { label: "Public repos", value: String(gh.total) },
        { label: "Stars earned", value: String(stars) },
        { label: "Followers", value: String(gh.followers) },
        { label: "Last push", value: own[0] ? ago(own[0].pushed_at) : "–" },
      ]
    : [];

  return (
    <Section id="home-github" side="left">
      <Heading kicker="Live from GitHub" title="Building in the open" text="These numbers come straight from the GitHub API when you open the page." />

      {state === "loading" && <p className="mt-8 text-sm text-slate-300">Syncing with GitHub...</p>}
      {state === "error" && <p className="mt-8 text-sm text-slate-300">GitHub is not reachable right now. Try again in a minute.</p>}

      {gh && (
        <div className="mt-8 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="tile p-4 text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-xs text-slate-300">{s.label}</p>
              </div>
            ))}
          </div>

          {langList.length > 0 && (
            <div className="tile p-5">
              <p className="text-sm font-semibold text-white">Languages across my repos</p>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/10">
                {langList.map(([name, c], i) => (
                  <span key={name} title={name} style={{ width: `${(c / langTotal) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-200">
                {langList.map(([name, c], i) => (
                  <li key={name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                    {name} {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="tile p-5">
            <p className="text-sm font-semibold text-white">Recently updated</p>
            <ul className="mt-3 divide-y divide-white/10">
              {own.slice(0, 5).map((r) => (
                <li key={r.name}>
                  <a
                    href={r.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 py-2.5 text-sm text-slate-100 transition hover:text-cyan-200"
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-slate-300">
                      {r.language && <span>{r.language}</span>}
                      {r.stargazers_count > 0 && <span>★ {r.stargazers_count}</span>}
                      <span>{ago(r.pushed_at)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Section>
  );
}
