import ScrambleText from "@/components/ScrambleText";
import Typewriter from "@/components/Typewriter";
import { NAME, ROLES, CONTACT } from "@/data/content";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative z-10 flex min-h-screen items-center px-6 pt-20"
    >
      {/* dark fade behind the text so it stays readable over the shapes */}
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-black/90 via-black/60 to-transparent md:w-4/5" />

      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl text-left">
          <p className="mb-4 text-sm tracking-widest text-cyan-300">
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

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#projects"
              className="rounded bg-green-400 px-6 py-2.5 font-bold text-black shadow-[0_0_20px_rgba(0,255,156,0.5)] transition hover:bg-green-300"
            >
              Projects
            </a>
            <a
              href={CONTACT.github}
              className="rounded border border-cyan-300 px-6 py-2.5 text-cyan-200 transition hover:bg-cyan-300 hover:text-black"
            >
              GitHub
            </a>
          </div>
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
