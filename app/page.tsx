import Scene from "@/components/Scene";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import { NAME, TITLE, ABOUT, SKILLS, PROJECTS, CONTACT } from "@/data/content";

function Heading({ children }: { children: string }) {
  return (
    <h2 className="mb-10 text-3xl font-bold text-green-400">
      <span className="text-green-700">$ </span>
      {children}
    </h2>
  );
}

const btn =
  "rounded border border-green-400 px-6 py-2 transition hover:bg-green-400 hover:text-black";

export default function Home() {
  return (
    <main className="relative font-mono text-green-400">
      <Scene />
      <Navbar />

      <section
        id="top"
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        <p className="mb-4 text-sm tracking-widest text-green-600">$ whoami</p>
        <h1 className="text-5xl font-bold md:text-7xl">{NAME}</h1>
        <p className="mt-4 text-xl text-green-300 md:text-2xl">{TITLE}</p>
        <div className="mt-10 flex gap-4">
          <a href={CONTACT.github} className={btn}>GitHub</a>
          <a href="#projects" className={btn}>Projects</a>
        </div>
      </section>

      <div className="relative z-10 bg-black/70 backdrop-blur-sm">
        <section id="about" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
          <Reveal>
            <Heading>about</Heading>
            <div className="max-w-2xl space-y-4 text-green-300">
              {ABOUT.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="skills" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
          <Reveal>
            <Heading>skills</Heading>
            <div className="grid gap-6 md:grid-cols-3">
              {SKILLS.map((s) => (
                <div key={s.group} className="rounded border border-green-900 bg-black/50 p-6">
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
                  className="group block h-full rounded border border-green-900 bg-black/50 p-6 transition hover:border-green-400"
                >
                  <h3 className="text-xl font-bold text-green-300 group-hover:text-green-400">
                    {p.name}
                  </h3>
                  <p className="mt-3 text-sm text-green-500">{p.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <li key={t} className="rounded border border-green-900 px-2 py-0.5 text-xs text-green-600">
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
            <p className="mb-6 text-green-300">Want to talk security, DevOps, or work together?</p>
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
