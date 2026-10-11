import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import SplitSection from "@/components/SplitSection";
import { ABOUT, CORE_AREAS } from "@/data/content";
import { FLAT, SKILL_GROUPS, SOURCES } from "@/data/skills";

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

const STATS = [
  { label: "skills", value: FLAT.length },
  { label: "categories", value: SKILL_GROUPS.length },
  {
    label: "used at Tkxel",
    value: FLAT.filter((s) => s.sources.includes(SOURCES[0].id)).length,
  },
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
    <SplitSection id="about">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <Reveal className="md:col-span-4">
          <div className="tile h-full p-6 md:p-8">
            <p className="mb-3 text-xs tracking-[0.3em] text-cyan-300">// profile.md</p>
            <p className="text-xl leading-relaxed text-green-100 md:text-2xl">
              <Highlight text={lead} />
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05} className="md:col-span-2">
          <div className="tile flex h-full flex-col justify-center gap-4 p-6">
            {STATS.map((st) => (
              <div key={st.label}>
                <CountUp to={st.value} className="text-3xl font-bold text-green-300" />
                <p className="text-[10px] tracking-widest text-cyan-300/80">
                  {st.label.toUpperCase()}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {rest.map((p, i) => (
          <Reveal key={p} delay={0.05 * i} className="md:col-span-3">
            <div className="tile h-full p-6">
              <p className="mb-2 text-xs tracking-[0.3em] text-pink-300">// {LABELS[i]}</p>
              <p className="leading-relaxed text-green-200/90">{p}</p>
            </div>
          </Reveal>
        ))}

        <Reveal className="md:col-span-6">
          <div className="tile p-6">
            <p className="mb-3 text-xs tracking-[0.3em] text-cyan-300">$ which tools</p>
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
          </div>
        </Reveal>

        <Reveal className="md:col-span-6">
          <div className="tile p-6">
            <p className="mb-4 text-xs tracking-[0.3em] text-cyan-300">$ ls core_areas/</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CORE_AREAS.map((a) => (
                <li
                  key={a.label}
                  className="flex items-center gap-3 rounded-lg border border-green-900/60 bg-black/40 px-3 py-3 text-sm text-green-300"
                >
                  <span className="text-lg">{a.icon}</span>
                  {a.label}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </SplitSection>
  );
}
