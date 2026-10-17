"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBug,
  FaCheck,
  FaGraduationCap,
  FaFlagCheckered,
  FaMagnifyingGlass,
  FaBullseye,
  FaFileLines,
  FaShieldHalved,
  FaServer,
  FaPython,
  FaBriefcase,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

const ease = [0.22, 1, 0.36, 1] as const;
const rise = (i = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, delay: i * 0.08, ease },
});

/* ───────── Journey ───────── */
const JOURNEY: { icon: IconType; title: string; sub: string; text: string }[] = [
  {
    icon: FaGraduationCap,
    title: "Diploma in Cloud Cyber Security",
    sub: "Al Nafi International College",
    text: "Where the fundamentals of security, networks and cloud came together.",
  },
  {
    icon: FaFlagCheckered,
    title: "Practice platforms",
    sub: "TryHackMe / Hack The Box",
    text: "Regular hands-on practice to build offensive skills in safe environments.",
  },
  {
    icon: FaBriefcase,
    title: "Red Team Intern",
    sub: "Tkxel",
    text: "Learning from experienced security professionals on real engagements.",
  },
];

export function Journey() {
  return (
    <div className="relative">
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="absolute bottom-6 left-5 top-6 w-px origin-top bg-gradient-to-b from-cyan-300/70 via-violet-300/40 to-transparent"
      />
      <div className="space-y-4">
        {JOURNEY.map((j, i) => (
          <motion.div key={j.title} {...rise(i)} className="relative flex gap-4">
            <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan-300/40 bg-[#070c16] text-cyan-200">
              <j.icon size={15} />
            </span>
            <div className="ab-card flex-1 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="font-semibold text-white">{j.title}</h3>
                <span className="font-mono text-xs text-cyan-300/80">{j.sub}</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{j.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Method ───────── */
const STEPS: { icon: IconType; t: string; d: string }[] = [
  { icon: FaMagnifyingGlass, t: "Recon", d: "Map what is visible." },
  { icon: FaBullseye, t: "Enumerate", d: "Probe services and inputs." },
  { icon: FaBug, t: "Exploit", d: "Prove the weakness safely." },
  { icon: FaShieldHalved, t: "Assess impact", d: "Measure the real risk." },
  { icon: FaFileLines, t: "Report", d: "Evidence and remediation." },
];

export function Method() {
  return (
    <div className="relative">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="absolute left-0 right-0 top-5 hidden h-px origin-left bg-gradient-to-r from-cyan-300/70 via-violet-300/50 to-transparent md:block"
      />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
        {STEPS.map((s, i) => (
          <motion.div key={s.t} {...rise(i)} className="flex flex-col">
            <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-cyan-300/40 bg-[#070c16] text-cyan-200">
              <s.icon size={14} />
            </span>
            <div className="ab-card mt-4 flex-1 p-4">
              <div className="font-mono text-[10px] text-slate-500">0{i + 1}</div>
              <h3 className="font-semibold text-white">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.d}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Labs ───────── */
const LABS: { icon: IconType; title: string; text: string; chips: string[]; state: string }[] = [
  {
    icon: FaBug,
    title: "OWASP Top 10 labs",
    text: "Each category tested against a local OWASP Juice Shop, with findings, methodology and remediation written up.",
    chips: ["Juice Shop", "Findings", "Remediation"],
    state: "Ongoing",
  },
  {
    icon: FaServer,
    title: "Vulnerability assessment lab",
    text: "Scanning and reporting with OpenVAS, following NIST SP 800-115 and PTES.",
    chips: ["OpenVAS", "NIST SP 800-115", "PTES"],
    state: "Ongoing",
  },
  {
    icon: FaPython,
    title: "My own Python security tool",
    text: "A larger cybersecurity tool built from scratch, documented and published on GitHub.",
    chips: ["Python", "GitHub"],
    state: "Planned",
  },
];

export function Labs() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {LABS.map((l, i) => (
        <motion.div
          key={l.title}
          {...rise(i)}
          whileHover={{ y: -4 }}
          className="ab-card flex h-full flex-col p-5"
        >
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
              <l.icon size={17} />
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                l.state === "Ongoing"
                  ? "border-emerald-300/40 text-emerald-200"
                  : "border-white/15 text-slate-400"
              }`}
            >
              {l.state}
            </span>
          </div>
          <h3 className="mt-4 font-semibold text-white">{l.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{l.text}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {l.chips.map((c) => (
              <span key={c} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-slate-300">
                {c}
              </span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ───────── Focus showcase (replaces the plain FocusGrid) ───────── */
type Detail = { blurb: string; points: string[]; tools: string[]; practice: string };
const DETAIL: Detail[] = [
  {
    blurb: "Thinking like an attacker, end to end: from first recon to a clear report the defender can use.",
    points: ["Recon, enumeration and exploitation workflow", "Understanding attack paths, not just single bugs", "Always inside authorised, safe lab scope"],
    tools: ["Nmap", "Metasploit", "Burp Suite"],
    practice: "TryHackMe / Hack The Box",
  },
  {
    blurb: "Finding how web apps break, and showing the fix, mapped to the OWASP Top 10.",
    points: ["Injection, broken access control, auth and session flaws", "Intercepting and tampering requests", "Each category documented with evidence"],
    tools: ["Burp Suite", "OWASP ZAP"],
    practice: "Local OWASP Juice Shop labs",
  },
  {
    blurb: "A structured way to find weaknesses, validate them and rank what to fix first.",
    points: ["Scanning, validating and prioritising findings", "Follows NIST SP 800-115 and PTES", "Results turned into a remediation list"],
    tools: ["OpenVAS", "Nmap"],
    practice: "OpenVAS vulnerability assessment lab",
  },
  {
    blurb: "The ground floor of security: knowing how systems and traffic really behave.",
    points: ["Comfortable on the Linux command line", "Services, ports and protocols", "Reading packets to see what is on the wire"],
    tools: ["Linux", "Wireshark", "Nmap"],
    practice: "Daily use in every lab",
  },
  {
    blurb: "Watching the defender's side so I understand what an attack looks like in the logs.",
    points: ["Log collection and monitoring", "Alerts and basic detection ideas", "Seeing my own lab activity from the blue-team view"],
    tools: ["Wazuh", "Wireshark"],
    practice: "Monitoring my own lab traffic",
  },
  {
    blurb: "Automating the boring parts and building my own tools.",
    points: ["Scripts that speed up recon and reporting", "Working towards a larger Python security tool", "Code kept and shared on GitHub"],
    tools: ["Python", "Git/GitHub"],
    practice: "Planned open-source security tool",
  },
  {
    blurb: "Understanding how cloud setups get misconfigured, and how to secure them.",
    points: ["Cloud security fundamentals", "Containers and isolated lab environments", "Misconfiguration as a common weakness"],
    tools: ["Docker", "Linux"],
    practice: "Diploma in Cloud Cyber Security",
  },
  {
    blurb: "A finding only matters if it is understood. I write it up so it can be acted on.",
    points: ["Findings with impact, evidence and remediation", "Methodology written per lab", "Clean README-style documentation"],
    tools: ["Markdown", "Git/GitHub"],
    practice: "Every lab I publish",
  },
];

const str = (a: unknown, keys: string[]) => {
  const o = (a ?? {}) as Record<string, unknown>;
  for (const k of keys) if (typeof o[k] === "string") return o[k] as string;
  return "";
};

export function FocusShowcase({ areas }: { areas: ReadonlyArray<unknown> }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const n = areas.length;

  useEffect(() => {
    if (!auto || n < 2) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % n), 6000);
    return () => clearTimeout(id);
  }, [auto, active, n]);

  const pick = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  const a = areas[active];
  const d = DETAIL[active] ?? { blurb: "", points: [], tools: [], practice: "" };
  const title = str(a, ["title", "name", "label"]);
  const icon = str(a, ["icon", "emoji"]);
  const blurb = str(a, ["desc", "description", "text"]) || d.blurb;

  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_1.15fr]">
      {/* tiles: always an even grid */}
      <div className="grid auto-rows-fr grid-cols-2 gap-3" role="tablist" aria-label="Focus areas">
        {areas.map((x, i) => {
          const on = i === active;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={on}
              onMouseEnter={() => pick(i)}
              onFocus={() => pick(i)}
              onClick={() => pick(i)}
              className={`ab-card relative flex min-h-[92px] flex-col items-start justify-between gap-2 p-3.5 text-left transition-colors ${
                on ? "!border-cyan-300/60 bg-cyan-300/[0.07]" : "hover:!border-white/25"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xl leading-none">{str(x, ["icon", "emoji"])}</span>
                <span className={`font-mono text-[10px] ${on ? "text-cyan-300" : "text-slate-500"}`}>0{i + 1}</span>
              </div>
              <span className={`text-[13px] font-semibold leading-snug ${on ? "text-white" : "text-slate-300"}`}>
                {str(x, ["title", "name", "label"])}
              </span>
              {on && (
                <motion.span
                  layoutId="focus-ring"
                  className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-cyan-300/50"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* detail panel */}
      <div className="ab-card relative flex min-h-[380px] flex-col overflow-hidden p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease }}
            className="flex flex-1 flex-col"
          >
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-3xl">
                {icon}
              </span>
              <div>
                <div className="font-mono text-xs text-cyan-300/80">
                  0{active + 1} / 0{n}
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">{blurb}</p>

            <ul className="mt-4 space-y-2">
              {d.points.map((pt) => (
                <li key={pt} className="flex gap-2.5 text-sm text-slate-300">
                  <FaCheck size={11} className="mt-1 shrink-0 text-emerald-300" />
                  {pt}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-5">
              <div className="flex flex-wrap gap-2">
                {d.tools.map((t) => (
                  <span key={t} className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono text-xs text-slate-200">
                    {t}
                  </span>
                ))}
              </div>
              {d.practice && (
                <div className="mt-3 font-mono text-xs text-slate-500">
                  practised on <span className="text-cyan-300/90">{d.practice}</span>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {auto && (
          <motion.div
            key={`bar-${active}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 6, ease: "linear" }}
            className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-cyan-300/60"
          />
        )}
      </div>
    </div>
  );
}
