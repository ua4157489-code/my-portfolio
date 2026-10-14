import Link from "next/link";
import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";
import { PROJECTS, EXPERIENCE, EDUCATION, ABOUT, CONTACT } from "@/data/content";
import { SKILL_GROUPS } from "@/data/skills";

// One tall block of the Home page. The text sits on one side and the 3D server rack on the other.
function Block({
  side,
  kicker,
  title,
  children,
}: {
  side: "left" | "right";
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="relative z-10 flex min-h-[95vh] items-center border-t border-white/5 px-6 py-24">
      <div className={`mx-auto flex w-full max-w-7xl ${side === "right" ? "justify-end" : "justify-start"}`}>
        <div className="w-full max-w-2xl">
          <Reveal>
            <p className="text-sm font-medium text-cyan-300">{kicker}</p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-white md:text-5xl">{title}</h2>
          </Reveal>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

const more = "mt-8 inline-block text-sm font-semibold text-cyan-300 transition hover:text-white";

export function Intro() {
  return (
    <Block side="right" kicker="Who I am" title="A little about me">
      <Reveal delay={0.05}>
        <p className="text-xl leading-relaxed text-slate-100 md:text-2xl">{ABOUT[0]}</p>
        <Link href="/about" className={more}>
          More about me →
        </Link>
      </Reveal>
    </Block>
  );
}

export function Focus() {
  const groups = SKILL_GROUPS.slice(0, 6);
  return (
    <Block side="left" kicker="What I work with" title="Skills by category">
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g, i) => (
          <Reveal key={g.group} delay={0.05 * i}>
            <div className="tile h-full p-5">
              <p className="flex items-center gap-2 font-bold text-white">
                <span>{g.icon}</span>
                {g.group}
              </p>
              <p className="mt-1 text-xs text-slate-300">{g.skills.length} skills</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {g.skills.slice(0, 4).map((s) => (
                  <li key={s.name} className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-slate-200">
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
      <Link href="/skills" className={more}>
        Explore all skills →
      </Link>
    </Block>
  );
}

export function FeaturedProjects() {
  return (
    <Block side="right" kicker="What I have built" title="Featured projects">
      <div className="space-y-4">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.name} delay={0.08 * i}>
            <div className="tile p-6">
              <h3 className="text-xl font-bold text-white">{p.name}</h3>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-200">{p.description}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <li key={t} className="rounded border border-white/15 px-2 py-0.5 text-xs text-slate-200">
                    {t}
                  </li>
                ))}
              </ul>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-semibold text-cyan-300 hover:text-white"
              >
                View on GitHub ↗
              </a>
            </div>
          </Reveal>
        ))}
      </div>
      <Link href="/projects" className={more}>
        See all projects →
      </Link>
    </Block>
  );
}

export function ExperienceSnapshot() {
  return (
    <Block side="left" kicker="Where I have worked" title="Experience">
      <div className="space-y-4">
        {EXPERIENCE.map((e, i) => (
          <Reveal key={e.company + e.role} delay={0.08 * i}>
            <div className="tile p-6">
              <p className="text-lg font-bold text-white">{e.role}</p>
              <p className="mt-1 text-sm text-cyan-300">{e.company}</p>
              {e.period && <p className="mt-1 text-xs text-slate-300">{e.period}</p>}
              {e.summary && <p className="mt-3 text-sm leading-relaxed text-slate-200">{e.summary}</p>}
            </div>
          </Reveal>
        ))}
      </div>
      <Link href="/experience" className={more}>
        Full experience →
      </Link>
    </Block>
  );
}

export function EducationSnapshot() {
  return (
    <Block side="right" kicker="Where I studied" title="Education">
      <div className="space-y-4">
        {EDUCATION.map((e, i) => (
          <Reveal key={e.degree + e.school} delay={0.08 * i}>
            <div className="tile p-6">
              <p className="text-lg font-bold text-white">{e.degree}</p>
              <p className="mt-1 text-sm text-cyan-300">{e.school}</p>
              {e.period && <p className="mt-1 text-xs text-slate-300">{e.period}</p>}
            </div>
          </Reveal>
        ))}
      </div>
      <Link href="/education" className={more}>
        Full education →
      </Link>
    </Block>
  );
}

export function FinalCta() {
  return (
    <Block side="left" kicker="Let's talk" title="Want to work together?">
      <Reveal delay={0.05}>
        <p className="text-lg leading-relaxed text-slate-200">
          Send me a message about security testing, labs or a project. I read everything.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="rounded-lg bg-gradient-to-r from-cyan-300 to-violet-400 px-6 py-3 text-sm font-extrabold text-black shadow-[0_0_24px_rgba(34,211,238,0.4)] transition hover:brightness-110"
          >
            Open the contact page
          </Link>
          <a
            href={CONTACT.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300"
          >
            GitHub ↗
          </a>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300"
          >
            Download CV
          </a>
        </div>
      </Reveal>
    </Block>
  );
}
