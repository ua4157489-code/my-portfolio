import Reveal from "@/components/Reveal";
import ScrollWords from "@/components/ScrollWords";
import AboutViz from "@/components/AboutViz";
import PhotoParticles from "@/components/PhotoParticles";
import SplitSection from "@/components/SplitSection";
import { ABOUT, CORE_AREAS } from "@/data/content";

const KEYWORDS = ["Offensive Security", "Red Teaming", "Vulnerability Assessment"];
const LABELS = ["Experience", "Currently", "Interests", "Goals"];
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

export default function About() {
  const [lead, ...rest] = ABOUT;

  return (
    <SplitSection id="about">
      <div className="space-y-24">
        <PhotoParticles className="relative mx-auto h-[420px] w-full max-w-md" />

        {/* the main statement: words light up as you scroll */}
        <ScrollWords
          text={lead}
          keywords={KEYWORDS}
          className="text-3xl font-semibold leading-snug tracking-tight md:text-4xl lg:text-[2.6rem]"
        />

        {/* charts built from the real skills data */}
        <AboutViz />

        {/* the rest of the story, in ruled rows instead of boxes */}
        <Reveal>
          <dl className="divide-y divide-white/10 border-y border-white/10">
            {rest.map((p, i) => (
              <div
                key={p}
                className="grid gap-3 py-8 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-10"
              >
                <dt className="text-base font-semibold text-acc-1">{LABELS[i]}</dt>
                <dd className="text-lg leading-relaxed text-slate-200">{p}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* focus areas as a clean numbered list */}
        <Reveal>
          <h3 className="mb-6 text-2xl font-bold text-white">What I focus on</h3>
          <ul className="grid gap-x-14 md:grid-cols-2">
            {CORE_AREAS.map((a, i) => (
              <li
                key={a.label}
                className="group flex items-center gap-4 border-b border-white/10 py-4 transition-colors hover:border-acc-1/60"
              >
                <span className="w-7 text-xl">{a.icon}</span>
                <span className="text-lg text-slate-100 transition-transform duration-300 group-hover:translate-x-2 group-hover:text-white">
                  {a.label}
                </span>
                <span className="ml-auto text-sm text-slate-500 transition-colors group-hover:text-acc-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* tools as one flowing line */}
        <Reveal>
          <h3 className="mb-4 text-2xl font-bold text-white">Tools I use</h3>
          <p className="text-lg leading-loose text-slate-300">
            {TOOLS.map((t, i) => (
              <span key={t}>
                {t}
                {i < TOOLS.length - 1 && <span className="mx-3 text-acc-2">/</span>}
              </span>
            ))}
          </p>
        </Reveal>
      </div>
    </SplitSection>
  );
}
