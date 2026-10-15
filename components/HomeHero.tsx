"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Magnetic from "@/components/Magnetic";
import SocialLinks from "@/components/SocialLinks";
import CountUp from "@/components/CountUp";
import { NAME, ROLES, ABOUT, PROJECTS } from "@/data/content";
import { FLAT, SKILL_GROUPS, SOURCES } from "@/data/skills";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\{}#$%&*";

// the name "decrypts" from random characters when the page loads
function useDecrypt(text: string) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (document.documentElement.dataset.motion === "calm") return;
    let frame = 0;
    const total = 28;
    const id = setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      setOut(
        text
          .split("")
          .map((c, i) => (c === " " || i < reveal ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("")
      );
      if (frame >= total) {
        clearInterval(id);
        setOut(text);
      }
    }, 45);
    return () => clearInterval(id);
  }, [text]);
  return out;
}

// types each role, deletes it, then moves to the next
function useTyper(words: string[]) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    const w = words[i % words.length] ?? "";
    const delay = del ? 28 : n === w.length ? 1400 : 65;
    const id = setTimeout(() => {
      if (!del && n === w.length) setDel(true);
      else if (del && n === 0) {
        setDel(false);
        setI(i + 1);
      } else setN(n + (del ? -1 : 1));
    }, delay);
    return () => clearTimeout(id);
  }, [n, del, i, words]);
  return (words[i % words.length] ?? "").slice(0, n);
}

const icon = "h-4 w-4";

export default function HomeHero() {
  const name = useDecrypt(NAME);
  const role = useTyper(ROLES);
  const stats = [
    { label: "Skills", value: FLAT.length },
    { label: "Categories", value: SKILL_GROUPS.length },
    { label: "Projects", value: PROJECTS.length },
    { label: "Places learned or used", value: SOURCES.length },
  ];

  return (
    <section id="home-hero" className="relative z-10 flex min-h-screen items-center px-6 pb-20 pt-32">
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1.5 text-xs font-medium text-cyan-100">
            <span className="badge-dot" />
            {ROLES[0]}
          </span>

          <h1
            aria-label={NAME}
            className="name-gradient mt-6 text-[clamp(3.2rem,10vw,8.5rem)] font-black leading-[0.95] tracking-tight"
          >
            {name}
          </h1>

          <p className="mt-6 min-h-[2.2rem] text-2xl font-semibold text-white md:text-3xl">
            <span className="text-cyan-300">&gt; </span>
            {role}
            <span className="caret" />
          </p>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200 md:text-lg">{ABOUT[0]}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-violet-400 px-6 py-3.5 text-sm font-extrabold text-black shadow-[0_0_30px_rgba(34,211,238,0.45)] transition hover:brightness-110"
              >
                <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                View projects
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-cyan-300 hover:bg-cyan-300/10"
              >
                <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22l-4-9-9-4z" />
                </svg>
                Get in touch
              </Link>
            </Magnetic>
            <Magnetic>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/25 px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-pink-300 hover:text-white"
              >
                <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                Download CV
              </a>
            </Magnetic>
          </div>

          <SocialLinks className="mt-8" />

          <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((st) => (
              <div key={st.label} className="border-l border-white/15 pl-4">
                <dt className="sr-only">{st.label}</dt>
                <dd>
                  <CountUp to={st.value} className="text-3xl font-extrabold text-white" />
                  <p className="mt-1 text-xs text-slate-300">{st.label}</p>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 text-xs text-slate-400">
            Press <kbd className="rounded border border-white/20 px-1.5">Ctrl K</kbd> to search,{" "}
            <kbd className="rounded border border-white/20 px-1.5">Ctrl /</kbd> for the terminal, or scroll and watch the
            shape change.
          </p>
        </div>
      </div>

      <div className="scroll-cue absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-slate-300 md:flex">
        Scroll
        <span className="cue-line" />
      </div>
    </section>
  );
}
