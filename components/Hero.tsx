import ScrambleText from "@/components/ScrambleText";
import Typewriter from "@/components/Typewriter";
import { NAME, ROLES, CONTACT } from "@/data/content";

// TODO: apne tags yahan badlo
const TAGS = ["Cloud Security", "Cyber Security", "DevOps"];

const corner = "pointer-events-none absolute h-4 w-4 border-green-400";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative z-10 flex min-h-screen items-center px-6 pt-24 md:pl-[5vw] md:pr-6"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-green-900/60 bg-black/90 p-7 shadow-[0_0_60px_rgba(0,255,156,0.08)] md:p-10">
        {/* HUD corner brackets */}
        <span className={`${corner} -left-px -top-px border-l-2 border-t-2`} />
        <span className={`${corner} -right-px -top-px border-r-2 border-t-2`} />
        <span className={`${corner} -bottom-px -left-px border-b-2 border-l-2`} />
        <span className={`${corner} -bottom-px -right-px border-b-2 border-r-2`} />

        {/* fake window bar */}
        <div className="mb-6 flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <span className="ml-3 tracking-widest text-cyan-300/80">~/portfolio</span>
        </div>

        <p className="mb-3 text-sm tracking-widest text-cyan-300">
          <span className="text-green-400">$</span> whoami
        </p>

        <h1
          className="glitch bg-gradient-to-r from-white via-green-200 to-emerald-400 bg-clip-text text-5xl font-extrabold text-transparent drop-shadow-[0_0_18px_rgba(0,255,156,0.45)] md:text-7xl"
          data-text={NAME}
        >
          <ScrambleText text={NAME} delay={1500} />
        </h1>

        <p className="mt-5 min-h-[2rem] text-xl text-white md:text-2xl">
          <span className="text-green-400">&gt; </span>
          <Typewriter phrases={ROLES} />
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <li
              key={t}
              className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200"
            >
              {t}
            </li>
          ))}
        </ul>

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
        </div>

      </div>

      <div className="absolute inset-x-0 bottom-8 flex justify-center">
        <a
          href="#about"
          className="animate-bounce text-xs tracking-widest text-green-400"
        >
          ↓ scroll
        </a>
      </div>
    </section>
  );
}
