import Reveal from "@/components/Reveal";
import { ABOUT, CORE_AREAS } from "@/data/content";

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <Reveal>
        <h2 className="glow mb-10 text-3xl font-bold text-green-400">
          <span className="text-green-700">$ </span>about
        </h2>

        <div className="max-w-2xl overflow-hidden rounded border border-green-900 bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-green-900 px-4 py-2 text-xs text-green-700">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2">about.txt</span>
          </div>
          <div className="space-y-4 p-6 leading-relaxed text-green-300">
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

      <Reveal delay={0.1}>
        <h3 className="mb-4 mt-12 text-sm tracking-widest text-cyan-300">
          $ ls core_areas/
        </h3>
        <ul className="grid max-w-2xl gap-3 sm:grid-cols-2">
          {CORE_AREAS.map((a) => (
            <li
              key={a.label}
              className="flex items-center gap-3 rounded border border-green-900 bg-black/50 px-4 py-3 text-sm text-green-300 transition hover:border-green-400 hover:shadow-[0_0_20px_rgba(0,255,156,0.15)]"
            >
              <span className="text-lg">{a.icon}</span>
              {a.label}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
