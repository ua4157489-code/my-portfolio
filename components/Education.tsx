import SectionTitle from "@/components/SectionTitle";
import Reveal from "@/components/Reveal";
import { EDUCATION } from "@/data/content";

export default function Education() {
  return (
    <section id="education" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <Reveal>
        <SectionTitle label="education" />
      </Reveal>

      <ol className="relative ml-3 border-l border-green-900">
        {EDUCATION.map((e, i) => (
          <li
            key={e.school + e.degree}
            id={`edu-${i}`}
            className="relative mb-40 ml-8 last:mb-0"
          >
            <span className="absolute -left-[38px] top-7 h-3 w-3 rounded-full border border-green-400 bg-black shadow-[0_0_10px_rgba(0,255,156,0.8)]" />
            <Reveal delay={i * 0.1}>
              <div className="rounded border border-green-900 bg-black/50 p-6 transition hover:border-green-400 hover:shadow-[0_0_25px_rgba(0,255,156,0.15)]">
                {e.period && (
                  <p className="text-xs tracking-widest text-green-600">{e.period}</p>
                )}
                <h3 className="mt-2 text-xl font-bold text-green-300">{e.degree}</h3>
                <p className="text-green-500">{e.school}</p>
                {e.details.length > 0 && (
                  <ul className="mt-4 space-y-1 text-sm text-green-500">
                    {e.details.map((d) => (
                      <li key={d}>&gt; {d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
