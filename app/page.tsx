import Hero from "@/components/Hero";
import Shatter2D from "@/components/Shatter2D";
import { EFFECTS } from "@/data/effects";
import CustomCursor from "@/components/CustomCursor";
import Scene from "@/components/Scene";
import MatrixRain from "@/components/MatrixRain";
import BootScreen from "@/components/BootScreen";
import ScrambleText from "@/components/ScrambleText";
import Typewriter from "@/components/Typewriter";
import Navbar from "@/components/Navbar";
import ScrollBar from "@/components/ScrollBar";
import Reveal from "@/components/Reveal";
import Education from "@/components/Education";
import { NAME, ROLES, ABOUT, SKILLS, PROJECTS, CONTACT } from "@/data/content";

function Heading({ children }: { children: string }) {
  return (
    <h2 className="glow mb-10 text-3xl font-bold text-green-400">
      <span className="text-green-700">$ </span>
      {children}
    </h2>
  );
}

const btn =
  "rounded border border-green-400 px-6 py-2 transition hover:bg-green-400 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,156,0.6)]";

export default function Home() {
  return (
    <main className="relative font-mono text-green-400">
      <BootScreen />
      <CustomCursor />
      {EFFECTS.scanlines && <div className="crt" />}
      <Scene />
      {EFFECTS.shatter2d && <Shatter2D />}
      {EFFECTS.matrixRain && <MatrixRain />}
      <Navbar />
      <ScrollBar />

      <Hero />

      <div className="relative z-10">
        <section id="about" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
          <Reveal>
            <Heading>about</Heading>
            <div className="max-w-2xl overflow-hidden rounded border border-green-900 bg-black/60">
              <div className="flex items-center gap-2 border-b border-green-900 px-4 py-2 text-xs text-green-700">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2">about.txt</span>
              </div>
              <div className="space-y-4 p-6 text-green-300">
                <p className="text-green-600">$ cat about.txt</p>
                {ABOUT.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <p className="text-green-600">
                  $ <span className="animate-pulse">▌</span>
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        <Education />

        <section id="skills" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
          <Reveal>
            <Heading>skills</Heading>
            <div className="grid gap-6 md:grid-cols-3">
              {SKILLS.map((s) => (
                <div
                  key={s.group}
                  className="rounded border border-green-900 bg-black/50 p-6 transition hover:border-green-400 hover:shadow-[0_0_25px_rgba(0,255,156,0.15)]"
                >
                  <h3 className="mb-4 font-bold text-green-300">{s.group}</h3>
                  <ul className="space-y-2 text-sm text-green-500">
                    {s.items.map((i) => (
                      <li key={i}>&gt; {i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="projects" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
          <Heading>projects</Heading>
          <div className="grid gap-6 md:grid-cols-2">
            {PROJECTS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block h-full rounded border border-green-900 bg-black/50 p-6 transition hover:border-green-400 hover:shadow-[0_0_25px_rgba(0,255,156,0.2)]"
                >
                  <h3 className="text-xl font-bold text-green-300 group-hover:text-green-400">
                    {p.name}
                  </h3>
                  <p className="mt-3 text-sm text-green-500">{p.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <li
                        key={t}
                        className="rounded border border-green-900 px-2 py-0.5 text-xs text-green-600"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </a>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
          <Reveal>
            <Heading>contact</Heading>
            <p className="mb-6 text-green-300">
              Want to talk security, DevOps, or work together?
            </p>
            <div className="flex flex-wrap gap-4">
              {CONTACT.email && <a href={`mailto:${CONTACT.email}`} className={btn}>Email</a>}
              {CONTACT.github && <a href={CONTACT.github} className={btn}>GitHub</a>}
              {CONTACT.linkedin && <a href={CONTACT.linkedin} className={btn}>LinkedIn</a>}
            </div>
          </Reveal>
        </section>

        <footer className="border-t border-green-900/50 py-8 text-center text-xs text-green-700">
          © {new Date().getFullYear()} {NAME}
        </footer>
      </div>
    </main>
  );
}
