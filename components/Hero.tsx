import ScrambleText from "@/components/ScrambleText";
import Typewriter from "@/components/Typewriter";
import CountUp from "@/components/CountUp";
import SocialLinks from "@/components/SocialLinks";
import { NAME, ROLES, CONTACT } from "@/data/content";
import { FLAT, SKILL_GROUPS, SOURCES } from "@/data/skills";

const stats = [
  { label: "skills", value: FLAT.length },
  { label: "categories", value: SKILL_GROUPS.length },
  {
    label: "used at Tkxel",
    value: FLAT.filter((s) => s.sources.includes(SOURCES[0].id)).length,
  },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative z-10 flex min-h-screen flex-col justify-center px-6 pb-32 pt-28 md:pl-[7vw]"
    >
      {/* soft dark fade behind the text */}
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-black/70 via-black/30 to-transparent md:w-3/5" />

      <div className="max-w-4xl">
        <p className="mb-6 inline-flex items-center gap-3 rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1.5 text-xs tracking-widest text-green-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          SYSTEM ONLINE · OPEN TO WORK
        </p>

        <p className="mb-2 text-sm tracking-[0.3em] text-cyan-300">
          <span className="text-green-400">$</span> whoami
        </p>

        <h1
          className="glitch bg-gradient-to-r from-white via-green-200 to-emerald-400 bg-clip-text text-[clamp(3.5rem,10vw,9rem)] font-extrabold leading-[0.95] text-transparent drop-shadow-[0_0_24px_rgba(0,255,156,0.35)]"
          data-text={NAME}
        >
          <ScrambleText text={NAME} delay={1500} />
        </h1>

        <p className="mt-6 min-h-[2.2rem] text-2xl text-white md:text-3xl">
          <span className="text-green-400">&gt; </span>
          <Typewriter phrases={ROLES} />
        </p>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300">
          Offensive security, red teaming and vulnerability assessment, built through
          hands-on labs and a Red Team internship at Tkxel.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#projects"
            className="rounded bg-green-400 px-6 py-2.5 font-bold text-black shadow-[0_0_20px_rgba(0,255,156,0.5)] transition hover:bg-green-300"
          >
            Projects →
          </a>
          <a
            href={CONTACT.github}
            className="rounded border border-cyan-300 px-6 py-2.5 text-cyan-200 transition hover:bg-cyan-300 hover:text-black"
          >
            GitHub
          </a>
          <a
            href="#contact"
            className="rounded border border-green-900 px-6 py-2.5 text-green-300 transition hover:border-green-400"
          >
            Contact
          </a>
        </div>

        <SocialLinks className="mt-6" />
      </div>

      {/* stats strip along the bottom */}
      <div className="absolute inset-x-0 bottom-0 border-t border-green-900/50 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 md:pl-[7vw]">
          <ul className="flex gap-8 md:gap-14">
            {stats.map((st) => (
              <li key={st.label}>
                <CountUp to={st.value} className="text-2xl font-bold text-green-300 md:text-3xl" />
                <p className="text-[10px] tracking-widest text-cyan-300/80">
                  {st.label.toUpperCase()}
                </p>
              </li>
            ))}
          </ul>
          <a
            href="#about"
            className="hidden animate-bounce text-xs tracking-widest text-green-400 sm:block"
          >
            ↓ SCROLL
          </a>
        </div>
      </div>
    </section>
  );
}
