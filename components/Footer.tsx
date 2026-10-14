"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type CSSProperties } from "react";
import {
  FaArrowRight,
  FaArrowUp,
  FaCheck,
  FaCopy,
  FaDownload,
  FaEnvelope,
  FaGithub,
} from "react-icons/fa6";
import {
  SiFramer,
  SiNextdotjs,
  SiReact,
  SiTailwindcss,
  SiThreedotjs,
  SiTypescript,
} from "react-icons/si";
import BrandLinks from "@/components/BrandLinks";

const EMAIL = "ua4157489@gmail.com";
const REPO = "https://github.com/ua4157489-code/my-portfolio";

const NAV = [
  { label: "About", href: "/about" },
  { label: "Experience", href: "/experience" },
  { label: "Education", href: "/education" },
  { label: "Skills", href: "/skills" },
  { label: "Projects", href: "/projects" },
  { label: "Contact", href: "/contact" },
];

const TECH = [
  { name: "Next.js", Icon: SiNextdotjs, color: "#ffffff" },
  { name: "React", Icon: SiReact, color: "#61DAFB" },
  { name: "TypeScript", Icon: SiTypescript, color: "#3178C6" },
  { name: "Tailwind CSS", Icon: SiTailwindcss, color: "#06B6D4" },
  { name: "Three.js", Icon: SiThreedotjs, color: "#e5e7eb" },
  { name: "Framer Motion", Icon: SiFramer, color: "#3b82f6" },
];

export default function Footer() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const move = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--fx", `${e.clientX - r.left}px`);
    el.style.setProperty("--fy", `${e.clientY - r.top}px`);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      id="footer"
      ref={ref}
      onMouseMove={move}
      className="relative z-10 overflow-hidden border-t border-white/10 bg-black/75"
    >
      {/* glowing top line */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px animate-pulse bg-gradient-to-r from-transparent via-acc-1 to-transparent"
      />
      {/* cursor glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(520px circle at var(--fx,50%) var(--fy,0%), rgba(34,211,238,0.10), transparent 65%)",
        }}
      />
      {/* faint grid that fades downward */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      {/* call to action */}
      <div className="relative mx-auto max-w-[1600px] px-8 pt-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-acc-1/10 via-black/40 to-acc-2/10 p-8 md:p-14">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-acc-1/20 blur-3xl"
          />
          <p className="relative font-mono text-xs uppercase tracking-[0.3em] text-acc-1">
            Let&apos;s talk
          </p>
          <h2 className="relative mt-3 max-w-3xl bg-gradient-to-r from-white via-acc-1 to-acc-2 bg-clip-text text-4xl font-extrabold leading-tight text-transparent md:text-6xl">
            Got a security challenge?
          </h2>
          <p className="relative mt-4 max-w-2xl text-lg text-slate-300">
            I would love to hear about it. Send a message and let&apos;s find the weak spots
            before someone else does.
          </p>

          <div className="relative mt-8 flex flex-wrap items-center gap-4">
            <span className="group relative inline-block">
              <span
                aria-hidden
                className="absolute -inset-1 animate-pulse rounded-xl bg-gradient-to-r from-acc-1 to-acc-2 opacity-50 blur-lg transition duration-300 group-hover:opacity-90"
              />
              <a
                href={`mailto:${EMAIL}`}
                className="relative inline-flex items-center gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-acc-1 via-acc-2 to-acc-1 bg-[length:200%_100%] px-8 py-3.5 text-base font-extrabold text-black transition-[background-position,transform] duration-500 hover:bg-[position:100%_0] active:scale-95"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/50 opacity-0 blur-sm transition-all duration-700 group-hover:left-full group-hover:opacity-100"
                />
                <FaEnvelope className="relative text-lg" />
                <span className="relative">Email me</span>
                <FaArrowRight className="relative text-sm transition-transform duration-300 group-hover:translate-x-1.5" />
              </a>
            </span>

            <button
              onClick={copy}
              className="group inline-flex items-center gap-3 rounded-lg border border-white/25 bg-white/5 px-6 py-3.5 font-mono text-sm text-white transition duration-300 hover:border-acc-1 hover:shadow-[0_0_28px_rgba(34,211,238,0.3)] active:scale-95"
            >
              {copied ? (
                <FaCheck className="text-emerald-400" />
              ) : (
                <FaCopy className="transition-transform group-hover:scale-110" />
              )}
              {copied ? "Copied to clipboard" : EMAIL}
            </button>

            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-lg border border-dashed border-acc-2/60 px-6 py-3.5 text-base text-slate-200 transition duration-300 hover:border-solid hover:border-acc-2 hover:bg-acc-2/10 hover:text-white active:scale-95"
            >
              <FaDownload className="transition-transform duration-300 group-hover:translate-y-1" />
              Download CV
            </a>
          </div>
        </div>
      </div>

      {/* columns */}
      <div className="relative mx-auto grid max-w-[1600px] gap-12 px-8 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <p className="text-2xl font-bold text-white">Umar Ali</p>
          <p className="mt-3 max-w-sm text-slate-400">
            Offensive security, red teaming and vulnerability assessment. Learning in the
            lab, applying it in the field.
          </p>
          <p className="mt-7 font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
            Connect
          </p>
          <BrandLinks className="mt-4" />
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
            Navigate
          </p>
          <ul className="mt-5 space-y-2.5">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className={`group inline-flex items-center gap-2 font-mono text-sm transition ${
                      active ? "text-acc-1" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <span
                      className={`h-px bg-acc-1 transition-all duration-300 ${
                        active ? "w-4" : "w-0 group-hover:w-4"
                      }`}
                    />
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
            Built with
          </p>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {TECH.map(({ name, Icon, color }) => (
              <li key={name}>
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-300 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--c)] hover:text-white hover:shadow-[0_0_18px_var(--g)]"
                  style={{ "--c": color, "--g": `${color}55` } as CSSProperties}
                >
                  <Icon className="text-base" style={{ color }} />
                  {name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-8 py-5 font-mono text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Umar Ali
            <span className="ml-3 text-slate-600">~/portfolio $ exit 0</span>
            <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-acc-1 align-middle" />
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              <FaGithub /> View the source code
            </a>
            <button
              onClick={top}
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 transition hover:border-acc-1 hover:text-white"
            >
              Back to top
              <FaArrowUp className="transition-transform group-hover:-translate-y-1" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
