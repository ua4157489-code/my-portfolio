"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { FaArrowRight, FaBug, FaCrosshairs, FaDocker, FaDownload, FaLinux, FaMagnifyingGlass, FaNetworkWired, FaPython, FaShieldHalved, FaSkull } from "react-icons/fa6";
import Typewriter from "./Typewriter";
import ScrambleText from "./ScrambleText";

const NAME = "Umar Ali";

const SKILLS = [
  { label: "Web App Security", icon: FaShieldHalved, hue: "#22d3ee", tip: "Auth, injection, access control",
    desc: "Testing web apps the way an attacker would, then validating and documenting what I find.",
    tools: ["Burp Suite", "OWASP ZAP", "Juice Shop", "DVWA"], href: "/projects" },
  { label: "Red Teaming", icon: FaSkull, hue: "#ff2d55", tip: "Adversary simulation end to end",
    desc: "Thinking in attack chains: recon, access, movement and impact, mapped to real adversary behaviour.",
    tools: ["Recon", "Exploitation", "Post-exploitation", "Reporting"], href: "/experience" },
  { label: "Vulnerability Assessment", icon: FaBug, hue: "#34d399", tip: "Find, validate, report",
    desc: "Scanning, validating findings to cut false positives, and writing clear remediation steps.",
    tools: ["OpenVAS", "NIST SP 800-115", "PTES", "Nmap"], href: "/projects" },
  { label: "OWASP Top 10", icon: FaCrosshairs, hue: "#fbbf24", tip: "The classics, tested for real",
    desc: "Hands-on write-ups for each OWASP Top 10 category with methodology, evidence and fixes.",
    tools: ["Juice Shop", "DVWA", "Write-ups", "Remediation"], href: "/projects" },
  { label: "MITRE ATT&CK", icon: FaNetworkWired, hue: "#a78bfa", tip: "Tactics mapped to techniques",
    desc: "Mapping findings to ATT&CK tactics and techniques so defenders can act on them.",
    tools: ["ATT&CK Navigator", "Tactics", "Techniques", "Detection ideas"], href: "/projects" },
  { label: "Recon & Enumeration", icon: FaMagnifyingGlass, hue: "#38bdf8", tip: "Map the attack surface first",
    desc: "Mapping the attack surface first: hosts, ports, services, directories and exposed technology.",
    tools: ["Nmap", "ffuf", "Amass", "whatweb"], href: "/skills" },
  { label: "Python Scripting", icon: FaPython, hue: "#facc15", tip: "Automating the boring parts",
    desc: "Small scripts and tools that automate repetitive recon and testing work.",
    tools: ["Python", "requests", "Bash", "Automation"], href: "/skills" },
  { label: "Linux & Docker", icon: FaLinux, hue: "#fb923c", tip: "Labs I build and break",
    desc: "Building and breaking my own lab environments with Linux, Docker and Kubernetes.",
    tools: ["Linux", "Docker", "Kubernetes", "Home lab"], href: "/skills" },
];

/* name: scramble reveal + cursor-lit gradient + glitch on hover */
function Name() {
  const ref = useRef<HTMLHeadingElement>(null);
  const [glitch, setGlitch] = useState(false);
  return (
    <h1
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        ref.current!.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      }}
      onPointerEnter={() => setGlitch(true)}
      onPointerLeave={() => setGlitch(false)}
      className="relative inline-block select-none text-6xl font-bold leading-none tracking-tight md:text-7xl"
      style={{ ["--mx" as string]: "50%" }}
      aria-label={NAME}
    >
      {glitch && (
        <>
          <span aria-hidden className="absolute inset-0 animate-[hg1_0.35s_steps(2)_infinite] text-cyan-300/70 mix-blend-screen">{NAME}</span>
          <span aria-hidden className="absolute inset-0 animate-[hg2_0.35s_steps(2)_infinite] text-rose-400/70 mix-blend-screen">{NAME}</span>
        </>
      )}
      <span
        className="relative inline-block bg-clip-text text-transparent"
        style={{
          backgroundImage:
            "radial-gradient(200px circle at var(--mx) 50%, #ffffff 0%, rgba(255,255,255,0) 60%), linear-gradient(100deg,#a78bfa 0%,#e879f9 55%,#22d3ee 100%)",
          backgroundSize: "100% 100%, 200% 100%",
          animation: "hshift 7s ease-in-out infinite alternate",
          filter: "drop-shadow(0 0 28px rgba(167,139,250,.35))",
        }}
      >
        <ScrambleText text={NAME} delay={300} />
      </span>
    </h1>
  );
}

const K = ({ c, children }: { c: string; children: React.ReactNode }) => (
  <span className="relative font-semibold text-white" style={{ textShadow: `0 0 18px ${c}66` }}>
    {children}
    <span className="absolute -bottom-0.5 left-0 h-[2px] w-full rounded" style={{ background: `linear-gradient(90deg,${c},transparent)` }} />
  </span>
);

function Chip({ s, i, active, onSelect }: { s: (typeof SKILLS)[number]; i: number; active: boolean; onSelect: () => void }) {
  const Icon = s.icon;
  const ref = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.9 + i * 0.08, type: "spring", stiffness: 180, damping: 16 }}
      whileHover={{ y: -4 }}
      className="group relative min-w-0"
    >
      <button
        type="button"
        aria-pressed={active}
        onClick={onSelect}
        ref={ref as never}
        onPointerMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          ref.current!.style.setProperty("--x", `${e.clientX - r.left}px`);
          ref.current!.style.setProperty("--y", `${e.clientY - r.top}px`);
        }}
        className="relative flex h-8 w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg border px-3 text-left text-xs text-slate-200 backdrop-blur-md transition-all"
        style={{ borderColor: active ? s.hue : `${s.hue}45`, background: active ? `${s.hue}22` : "rgba(255,255,255,0.03)", boxShadow: active ? `0 0 22px ${s.hue}55` : "none" }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(90px circle at var(--x) var(--y), ${s.hue}45, transparent 70%)` }}
        />
        <Icon className="relative shrink-0 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125" style={{ color: s.hue }} />
        <span className="relative flex-1 truncate">{s.label}</span>
        <span aria-hidden className={`relative h-1.5 w-1.5 shrink-0 rounded-full ${active ? "" : "animate-pulse"}`} style={{ background: s.hue, boxShadow: `0 0 8px ${s.hue}` }} />
      </button>
      <span className="pointer-events-none absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-md border border-white/10 bg-black/85 px-2.5 py-1 text-[11px] text-slate-300 opacity-0 backdrop-blur transition-all duration-200 group-hover:translate-y-0.5 group-hover:opacity-100">
        {active ? "Click to close" : `${s.tip} · click`}
      </span>
    </motion.div>
  );
}

function Magnetic({ children, strength = 0.3, className = "" }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 15 });
  const sy = useSpring(y, { stiffness: 220, damping: 15 });
  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SkillPanel({ s, row, onClose }: { s: (typeof SKILLS)[number]; row: number; onClose: () => void }) {
  const Icon = s.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="absolute inset-x-0 top-full z-30 mt-2 rounded-xl border p-3 backdrop-blur-xl md:inset-x-auto md:left-full md:top-[var(--t)] md:ml-3 md:mt-0 md:w-64"
      style={{ ["--t" as string]: `${row * 40 - 8}px`, borderColor: `${s.hue}66`, background: "rgba(5,8,16,0.94)", boxShadow: `0 16px 50px -12px ${s.hue}77` }}
    >
      <span aria-hidden className="absolute -left-1.5 top-[22px] hidden h-3 w-3 rotate-45 border-b border-l md:block" style={{ borderColor: `${s.hue}66`, background: "rgb(5,8,16)" }} />
      <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${s.hue},transparent)` }} />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${s.hue}20`, color: s.hue }}>
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{s.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{s.desc}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {s.tools.map((t) => (
              <span key={t} className="rounded border px-2 py-0.5 text-[11px] text-slate-200" style={{ borderColor: `${s.hue}40`, background: `${s.hue}12` }}>
                {t}
              </span>
            ))}
          </div>
          <Link href={s.href} className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: s.hue }}>
            See related work <FaArrowRight className="text-[10px]" />
          </Link>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="text-lg leading-none text-slate-400 hover:text-white">
          ×
        </button>
      </div>
    </motion.div>
  );
}

export default function HeroCopy() {
  const [open, setOpen] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(null);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key);
    };
  }, []);
  return (
    <div className="max-w-xl [@media(max-height:700px)]:origin-left [@media(max-height:700px)]:scale-[0.85]">
      <style>{`
        @keyframes hshift{from{background-position:0 0,0% 0}to{background-position:0 0,100% 0}}
        @keyframes hg1{0%{transform:translate(-3px,1px)}50%{transform:translate(3px,-1px)}100%{transform:translate(-2px,0)}}
        @keyframes hg2{0%{transform:translate(3px,-1px)}50%{transform:translate(-3px,1px)}100%{transform:translate(2px,0)}}
        @keyframes hspin{to{transform:rotate(360deg)}}
      `}</style>

      <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-black/40 px-3 py-1 text-xs text-cyan-300 backdrop-blur">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
        </span>
        Red Team &amp; Offensive Security Intern
      </p>
      <p className="mb-1 text-sm tracking-widest text-cyan-400/70">$ whoami</p>

      <Name />

      <p className="mt-3 min-h-[2rem] text-lg text-cyan-200 md:text-2xl">
        <span className="text-cyan-500">&gt; </span>
        <Typewriter phrases={["Breaking web apps, legally", "Red Team operations", "Vulnerability assessment", "Learning by breaking things"]} />
      </p>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base"
      >
        I find and validate <K c="#ff2d55">real weaknesses</K> in <K c="#22d3ee">web applications</K> and <K c="#34d399">networks</K>, then turn them into{" "}
        <K c="#a78bfa">clear, fixable reports</K>. Working at{" "}
        <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-violet-200 ring-1 ring-violet-400/30">Tkxel</span>, and sharpening the craft in my own labs.
      </motion.p>

      <div ref={box} className="relative mt-4 max-w-xl">
        <div className="grid grid-cols-2 gap-2">
          {SKILLS.map((s, i) => (
            <Chip key={s.label} s={s} i={i} active={open === i} onSelect={() => setOpen(open === i ? null : i)} />
          ))}
        </div>
        <AnimatePresence>{open !== null && <SkillPanel key={open} s={SKILLS[open]} row={Math.floor(open / 2)} onClose={() => setOpen(null)} />}</AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        className="mt-6 flex max-w-xl items-center gap-3"
      >
        <Magnetic className="flex-1">
          <Link
            href="/projects"
            className="group relative flex h-11 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl px-4 text-sm font-bold text-black transition-transform active:scale-95"
            style={{
              background: "linear-gradient(120deg,#67e8f9,#a78bfa 55%,#e879f9)",
              boxShadow: "0 0 0 1px rgba(255,255,255,.25) inset, 0 10px 40px -8px rgba(167,139,250,.8)",
            }}
          >
            <span aria-hidden className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/60 blur-md transition-all duration-700 group-hover:left-[130%]" />
            <span className="relative whitespace-nowrap">Explore my labs</span>
            <FaArrowRight className="relative transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </Magnetic>

        <Magnetic className="flex-1">
          <Link href="/contact" className="group relative flex h-11 w-full overflow-hidden rounded-xl p-[1.5px] transition-transform active:scale-95">
            <span
              aria-hidden
              className="absolute -inset-[200%] animate-[hspin_3.5s_linear_infinite] opacity-60 transition-opacity group-hover:opacity-100"
              style={{ background: "conic-gradient(from 0deg,transparent 0 60%,#22d3ee 80%,#e879f9 100%)" }}
            />
            <span className="relative flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-[#0b0b14] px-5 text-sm text-slate-100 transition-colors group-hover:bg-[#12121f]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              Let&apos;s talk
            </span>
          </Link>
        </Magnetic>

        <a href="/resume.pdf" download className="group relative inline-flex h-11 shrink-0 items-center gap-2 px-2 text-sm text-slate-300 transition-colors hover:text-white">
          <span>Download CV</span>
          <FaDownload className="transition-transform duration-300 group-hover:translate-y-0.5" />
          <span className="absolute bottom-2 left-2 h-px w-[calc(100%-1rem)] origin-left scale-x-50 bg-gradient-to-r from-violet-400 to-cyan-300 transition-transform duration-500 group-hover:scale-x-100" />
        </a>
      </motion.div>

      <p className="mt-6 text-xs tracking-widest text-cyan-400/60">SCROLL TO FLY THROUGH ↓</p>
    </div>
  );
}
