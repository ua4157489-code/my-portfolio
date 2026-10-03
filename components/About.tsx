import Reveal from "@/components/Reveal";
import { ABOUT, CORE_AREAS } from "@/data/content";

const KEYWORDS = ["Offensive Security", "Red Teaming", "Vulnerability Assessment"];
const LABELS = ["experience", "currently", "interests", "goals"];
const TOOLS = [
  "Linux",
  "Python",
  "Docker",
  "Git/GitHub",
  "Nmap",
  "Burp Suite",
  "OWASP ZAP",
  "Wireshark",
  "Metasploit",
  "Wazuh",
];

function Highlight({ text }: { text: string }) {
  const re = new RegExp(`(${KEYWORDS.join("|")})`, "g");
  return (
    <>
      {text.split(re).map((part, i) =>
        KEYWORDS.includes(part) ? (
          <span key={i} className="font-semibold text-green-300">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function About() {
  const [lead, ...rest] = ABOUT;

  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-28">
      <Reveal>
        <div className="mb-12 flex items-end justify-between gap-6 border-b border-green-900/60 pb-4">
          <h2 className="glow text-3xl font-bold text-green-400">
            <span className="text-green-700">$ </span>about
          </h2>
          <p className="hidden text-xs tracking-widest text-green-700 sm:block">
            // profile.md
          </p>
        </div>
      </Reveal>

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          {/* big intro */}
          <Reveal>
            <p className="text-xl leading-relaxed text-green-100 md:text-2xl">
              <Highlight text={lead} />
            </p>
          </Reveal>

          {/* timeline of the rest */}
          <Reveal delay={0.05}>
            <ol className="space-y-7 border-l border-green-900 pl-7">
              {rest.map((p, i) => (
                <li key={p} className="relative">
                  <span className="absolute -left-[33px] top-1.5 h-2 w-2 rounded-full bg-green-400 shadow-[0_0_10px_#00ff9c]" />
                  <p className="mb-1 text-xs tracking-widest text-cyan-300">
                    // {LABELS[i]}
                  </p>
                  <p className="leading-relaxed text-green-200/90">{p}</p>
                </li>
              ))}
            </ol>
          </Reveal>

          {/* tools */}
          <Reveal delay={0.1}>
            <p className="mb-3 text-xs tracking-widest text-cyan-300">$ which tools</p>
            <ul className="flex flex-wrap gap-2">
              {TOOLS.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-green-800 bg-green-400/5 px-3 py-1 text-xs text-green-300"
                >
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* core areas */}
          <Reveal delay={0.1}>
            <p className="mb-3 text-xs tracking-widest text-cyan-300">
              $ ls core_areas/
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {CORE_AREAS.map((a) => (
                <li
                  key={a.label}
                  className="flex items-center gap-3 rounded border border-green-900 bg-black/60 px-4 py-3 text-sm text-green-300 transition hover:border-green-400 hover:shadow-[0_0_20px_rgba(0,255,156,0.15)]"
                >
                  <span className="text-lg">{a.icon}</span>
                  {a.label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* right column stays empty: the 3D portrait lives here, in the background */}
        <div className="hidden lg:col-span-5 lg:block" aria-hidden />
      </div>
    </section>
  );
}
