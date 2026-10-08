import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import { EXPERIENCE } from "@/data/content";
import { FLAT } from "@/data/skills";

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <Reveal>
        <SectionTitle label="experience" />
      </Reveal>

      <ol className="relative ml-3 space-y-10 border-l border-pink-500/40">
        {EXPERIENCE.map((e, i) => {
          const used = FLAT.filter((s) =>
            s.sources.some((id) => id.toLowerCase().includes(e.company.toLowerCase()))
          );
          return (
            <li key={e.company + e.role} className="relative ml-8">
              <span className="absolute -left-[38px] top-8 h-3 w-3 rounded-full border border-pink-400 bg-black shadow-[0_0_12px_rgba(255,45,111,0.8)]" />
              <Reveal delay={i * 0.1}>
                <div className="overflow-hidden rounded-xl border border-pink-500/30 bg-black/60 shadow-[0_0_40px_rgba(255,45,111,0.08)] backdrop-blur-sm">
                  <div className="flex items-center gap-2 border-b border-pink-500/20 px-4 py-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                    <span className="ml-2 text-pink-300/80">
                      {e.company.toLowerCase()}@redteam:~
                    </span>
                  </div>

                  <div className="space-y-4 p-6 font-mono text-sm">
                    <p className="text-green-600">$ cat role.txt</p>
                    <div className="space-y-1 text-green-200">
                      <p>
                        <span className="text-cyan-300">role</span>
                        {"     : "}
                        <span className="font-bold text-white">{e.role}</span>
                      </p>
                      <p>
                        <span className="text-cyan-300">company</span>
                        {"  : "}
                        {e.company}
                      </p>
                      {e.period && (
                        <p>
                          <span className="text-cyan-300">period</span>
                          {"   : "}
                          {e.period}
                        </p>
                      )}
                    </div>

                    {e.summary && (
                      <p className="leading-relaxed text-green-100">{e.summary}</p>
                    )}

                    {e.highlights.length > 0 && (
                      <ul className="space-y-1 text-green-300">
                        {e.highlights.map((h) => (
                          <li key={h}>&gt; {h}</li>
                        ))}
                      </ul>
                    )}

                    {used.length > 0 && (
                      <>
                        <p className="pt-2 text-green-600">$ ls skills/</p>
                        <ul className="flex flex-wrap gap-2">
                          {used.map((s) => (
                            <li
                              key={s.name}
                              className="rounded-full border border-pink-500/40 bg-pink-500/10 px-3 py-1 text-xs text-pink-100"
                            >
                              {s.name}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
