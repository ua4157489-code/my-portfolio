import ScrambleText from "@/components/ScrambleText";
import Typewriter from "@/components/Typewriter";
import CountUp from "@/components/CountUp";
import SocialLinks from "@/components/SocialLinks";
import Magnetic from "@/components/Magnetic";
import ThreatFeed from "@/components/ThreatFeed";
import { NAME, ROLES } from "@/data/content";
import { FLAT, SKILL_GROUPS, SOURCES } from "@/data/skills";

const stats = [
  { label: "Skills", value: FLAT.length },
  { label: "Categories", value: SKILL_GROUPS.length },
  {
    label: "Used at Tkxel",
    value: FLAT.filter((s) => s.sources.includes(SOURCES[0].id)).length,
  },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative z-10 flex min-h-screen flex-col justify-center px-6 pb-36 pt-32 md:pl-[7vw]"
    >
      {/* soft dark fade behind the text so it stays readable over the city */}
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-black/80 via-black/40 to-transparent md:w-3/5" />

      <div className="max-w-4xl">

        <h1
          className="glitch bg-gradient-to-r from-white via-acc-1 to-acc-2 bg-clip-text text-[clamp(3.5rem,10vw,9rem)] font-extrabold leading-[0.95] tracking-tight text-transparent drop-shadow-[0_0_28px_rgba(34,211,238,0.35)]"
          data-text={NAME}
        >
          <ScrambleText text={NAME} delay={1500} />
        </h1>

        <p className="mt-7 min-h-[2.2rem] text-2xl font-semibold text-white md:text-3xl">
          <span className="text-acc-1">&gt; </span>
          <Typewriter phrases={ROLES} />
        </p>

        <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-200">
          Offensive security, red teaming and vulnerability assessment, built through
          hands-on labs and a Red Team internship at Tkxel.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Magnetic>
            <a
              href="#projects"
              className="inline-block rounded-lg bg-gradient-to-r from-acc-1 to-acc-2 px-7 py-3 text-base font-extrabold text-black shadow-[0_0_28px_rgba(34,211,238,0.45)] transition hover:brightness-110"
            >
              View projects
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#contact"
              className="inline-block rounded-lg border border-white/25 bg-white/5 px-7 py-3 text-base font-semibold text-white transition hover:border-acc-1 hover:bg-acc-1/10"
            >
              Get in touch
            </a>
          </Magnetic>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-3 text-base text-slate-300 underline decoration-acc-2/60 underline-offset-4 transition hover:text-white"
          >
            Download CV
          </a>
        </div>

        <SocialLinks className="mt-8" />
      </div>

      {/* live event feed (wide screens) */}
      <div className="absolute bottom-40 right-[4vw] hidden xl:block">
        <ThreatFeed />
      </div>

      {/* stats strip */}
      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/55 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:pl-[7vw]">
          <ul className="flex gap-8 md:gap-14">
            {stats.map((st) => (
              <li key={st.label}>
                <CountUp to={st.value} className="text-2xl font-bold text-white md:text-3xl" />
                <p className="text-xs text-slate-400">{st.label}</p>
              </li>
            ))}
          </ul>
          <a
            href="#about"
            className="hidden animate-bounce text-sm text-slate-300 transition hover:text-white sm:block"
          >
            Scroll to explore
          </a>
        </div>
      </div>
    </section>
  );
}
