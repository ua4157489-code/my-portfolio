"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  FaArrowRight,
  FaBug,
  FaCrosshairs,
  FaDownload,
  FaNetworkWired,
  FaShieldHalved,
  FaSkull,
} from "react-icons/fa6";

/* ───────── data ───────── */
const NAME = "Umar Ali";

const PHRASES = [
  "Learning by breaking things",
  "Thinking like an attacker",
  "Turning exploits into fixes",
  "Hunting weaknesses before they do",
];

const SKILLS = [
  { label: "Web App Security", icon: FaShieldHalved, hue: "#22d3ee", tip: "Auth, injection, access control" },
  { label: "Red Teaming", icon: FaSkull, hue: "#ff2d55", tip: "Adversary simulation end to end" },
  { label: "Vulnerability Assessment", icon: FaBug, hue: "#34d399", tip: "Find, validate, report" },
  { label: "OWASP Top 10", icon: FaCrosshairs, hue: "#fbbf24", tip: "The classics, tested for real" },
  { label: "MITRE ATT&CK", icon: FaNetworkWired, hue: "#a78bfa", tip: "Tactics mapped to techniques" },
];

/* ───────── typing tagline ───────── */
function Typer() {
  const [i, setI] = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const full = PHRASES[i];
    const t = setTimeout(
      () => {
        if (!del) {
          setTxt(full.slice(0, txt.length + 1));
          if (txt.length + 1 === full.length) setTimeout(() => setDel(true), 1600);
        } else {
          setTxt(full.slice(0, txt.length - 1));
          if (txt.length - 1 === 0) {
            setDel(false);
            setI((n) => (n + 1) % PHRASES.length);
          }
        }
      },
      del ? 28 : 55
    );
    return () => clearTimeout(t);
  }, [txt, del, i]);

  return (
    <p className="mt-3 text-xl sm:text-2xl text-violet-100/90 min-h-[2rem]">
      <span className="text-violet-400">&gt;</span> {txt}
      <span className="ml-1 inline-block h-[1.1em] w-[0.55em] translate-y-[0.18em] bg-violet-300/80 animate-pulse" />
    </p>
  );
}

/* ───────── name: letter reveal + cursor-lit gradient + glitch on hover ───────── */
function Name() {
  const ref = useRef<HTMLHeadingElement>(null);
  const [glitch, setGlitch] = useState(false);

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    ref.current!.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
  };

  return (
    <h1
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={() => setGlitch(true)}
      onPointerLeave={() => setGlitch(false)}
      className="relative mt-4 select-none text-6xl sm:text-7xl lg:text-8xl font-bold leading-none tracking-tight"
      style={{ ["--mx" as string]: "50%" }}
      aria-label={NAME}
    >
      {/* glitch ghosts */}
      {glitch && (
        <>
          <span aria-hidden className="absolute inset-0 text-cyan-300/70 mix-blend-screen animate-[hglitch_0.35s_steps(2)_infinite]">
            {NAME}
          </span>
          <span aria-hidden className="absolute inset-0 text-rose-400/70 mix-blend-screen animate-[hglitch2_0.35s_steps(2)_infinite]">
            {NAME}
          </span>
        </>
      )}
      <span
        className="relative inline-block bg-clip-text text-transparent"
        style={{
          backgroundImage:
            "radial-gradient(220px circle at var(--mx) 50%, #ffffff 0%, rgba(255,255,255,0) 60%), linear-gradient(100deg,#a78bfa 0%,#e879f9 55%,#22d3ee 100%)",
          backgroundSize: "100% 100%, 200% 100%",
          animation: "hshift 7s ease-in-out infinite alternate",
          filter: "drop-shadow(0 0 28px rgba(167,139,250,.35))",
        }}
      >
        {NAME.split("").map((c, n) => (
          <motion.span
            key={n}
            initial={{ opacity: 0, y: 40, rotateX: -80, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.15 + n * 0.06, type: "spring", stiffness: 140, damping: 14 }}
            className="inline-block"
            style={{ whiteSpace: "pre" }}
          >
            {c}
          </motion.span>
        ))}
      </span>
      <style>{`
        @keyframes hshift{from{background-position:0 0,0% 0}to{background-position:0 0,100% 0}}
        @keyframes hglitch{0%{transform:translate(-3px,1px)}50%{transform:translate(3px,-1px)}100%{transform:translate(-2px,0)}}
        @keyframes hglitch2{0%{transform:translate(3px,-1px)}50%{transform:translate(-3px,1px)}100%{transform:translate(2px,0)}}
      `}</style>
    </h1>
  );
}

/* ───────── paragraph with highlighted keywords ───────── */
const K = ({ c, children }: { c: string; children: React.ReactNode }) => (
  <span
    className="relative font-semibold text-white"
    style={{ textShadow: `0 0 18px ${c}66` }}
  >
    {children}
    <span className="absolute -bottom-0.5 left-0 h-[2px] w-full rounded" style={{ background: `linear-gradient(90deg,${c},transparent)` }} />
  </span>
);

function Paragraph() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.7 }}
      className="mt-6 max-w-2xl text-[15px] sm:text-base leading-relaxed text-slate-300/90"
    >
      I find and validate <K c="#ff2d55">real weaknesses</K> in{" "}
      <K c="#22d3ee">web applications</K> and <K c="#34d399">networks</K>, then turn them into{" "}
      <K c="#a78bfa">clear, fixable reports</K>. Currently a Red Team intern at{" "}
      <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-violet-200 ring-1 ring-violet-400/30">Tkxel</span>
      , and sharpening the craft in my own labs.
    </motion.p>
  );
}

/* ───────── skill chips ───────── */
function Chip({ s, i }: { s: (typeof SKILLS)[number]; i: number }) {
  const Icon = s.icon;
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--x", `${e.clientX - r.left}px`);
    ref.current!.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.1 + i * 0.08, type: "spring", stiffness: 180, damping: 16 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <div
        ref={ref}
        onPointerMove={onMove}
        className="relative flex items-center gap-2 overflow-hidden rounded-full border bg-white/[0.03] px-3.5 py-2 text-[13px] text-slate-200 backdrop-blur-md transition-colors"
        style={{ borderColor: `${s.hue}40` }}
      >
        {/* cursor spotlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(90px circle at var(--x) var(--y), ${s.hue}40, transparent 70%)` }}
        />
        <Icon className="relative shrink-0 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125" style={{ color: s.hue }} />
        <span className="relative">{s.label}</span>
        <span
          aria-hidden
          className="relative h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: s.hue, boxShadow: `0 0 8px ${s.hue}` }}
        />
      </div>
      {/* tooltip */}
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/80 px-2.5 py-1 text-[11px] text-slate-300 opacity-0 backdrop-blur transition-all duration-200 group-hover:translate-y-0.5 group-hover:opacity-100">
        {s.tip}
      </span>
    </motion.div>
  );
}

/* ───────── magnetic wrapper ───────── */
function Magnetic({ children, strength = 0.35 }: { children: React.ReactNode; strength?: number }) {
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
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

/* ───────── buttons ───────── */
function Buttons() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.6 }}
      className="mt-10 flex flex-wrap items-center gap-4"
    >
      {/* primary: glow + shine sweep + arrow slide */}
      <Magnetic>
        <Link
          href="/projects"
          className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl px-7 py-3.5 text-sm font-bold text-black transition-transform active:scale-95"
          style={{
            background: "linear-gradient(120deg,#c4b5fd,#a78bfa 45%,#e879f9)",
            boxShadow: "0 0 0 1px rgba(255,255,255,.25) inset, 0 10px 40px -8px rgba(167,139,250,.8)",
          }}
        >
          <span
            aria-hidden
            className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/60 blur-md transition-all duration-700 group-hover:left-[130%]"
          />
          <span className="relative">Explore my labs</span>
          <FaArrowRight className="relative transition-transform duration-300 group-hover:translate-x-1.5" />
        </Link>
      </Magnetic>

      {/* secondary: rotating gradient border */}
      <Magnetic>
        <Link
          href="/contact"
          className="group relative inline-flex overflow-hidden rounded-xl p-[1.5px] transition-transform active:scale-95"
        >
          <span
            aria-hidden
            className="absolute -inset-[200%] animate-[hspin_3.5s_linear_infinite] opacity-60 transition-opacity group-hover:opacity-100"
            style={{ background: "conic-gradient(from 0deg,transparent 0 60%,#22d3ee 80%,#e879f9 100%)" }}
          />
          <span className="relative flex items-center gap-2.5 rounded-[10px] bg-[#0b0b14] px-7 py-3.5 text-sm text-slate-100 transition-colors group-hover:bg-[#12121f]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
            Let&apos;s talk
          </span>
          <style>{`@keyframes hspin{to{transform:rotate(360deg)}}`}</style>
        </Link>
      </Magnetic>

      {/* tertiary: CV with draw-underline + bouncing icon */}
      <a
        href="/cv.pdf"
        download
        className="group relative inline-flex items-center gap-2 px-1 py-2 text-sm text-slate-300 transition-colors hover:text-white"
      >
        <span>Download CV</span>
        <FaDownload className="transition-transform duration-300 group-hover:translate-y-0.5 group-hover:animate-bounce" />
        <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-50 bg-gradient-to-r from-violet-400 to-cyan-300 transition-transform duration-500 group-hover:scale-x-100" />
      </a>
    </motion.div>
  );
}

/* ───────── hero ───────── */
export default function Hero() {
  return (
    <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-6 pb-16 pt-28">
      {/* role badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-fit"
      >
        <div className="relative inline-flex items-center gap-2.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-1.5 text-[13px] text-violet-100 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
          </span>
          Red Team &amp; Offensive Security Intern
        </div>
      </motion.div>

      <p className="mt-8 text-sm text-violet-300/60">
        <span className="text-violet-400/80">$</span> whoami
      </p>

      <Name />
      <Typer />
      <Paragraph />

      <div className="mt-8 flex flex-wrap gap-3">
        {SKILLS.map((s, i) => (
          <Chip key={s.label} s={s} i={i} />
        ))}
      </div>

      <Buttons />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.1 }}
        className="mt-14 flex items-center gap-3 text-[11px] tracking-[0.25em] text-violet-300/50"
      >
        <span className="relative h-8 w-[18px] rounded-full border border-violet-300/30">
          <span className="absolute left-1/2 top-1.5 h-1.5 w-1 -translate-x-1/2 animate-bounce rounded-full bg-violet-300/70" />
        </span>
        SCROLL TO FLY THROUGH
      </motion.div>
    </section>
  );
}
