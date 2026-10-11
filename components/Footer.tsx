import SocialLinks from "@/components/SocialLinks";
import LiveClock from "@/components/LiveClock";
import Magnetic from "@/components/Magnetic";
import { NAME, CONTACT } from "@/data/content";

const NAV: [string, string][] = [
  ["about", "About"],
  ["experience", "Experience"],
  ["education", "Education"],
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["contact", "Contact"],
];

const STACK = ["Next.js", "React", "TypeScript", "Tailwind CSS", "Three.js", "Framer Motion"];

const CONNECT: { label: string; href: string }[] = [
  { label: "Email", href: CONTACT.email ? "mailto:" + CONTACT.email : "" },
  { label: "GitHub", href: CONTACT.github },
  { label: "LinkedIn", href: CONTACT.linkedin },
  { label: "Instagram", href: CONTACT.instagram },
  { label: "Facebook", href: CONTACT.facebook },
].filter((c) => c.href);

const colTitle = "mb-4 text-sm font-semibold text-white";
const link = "text-sm text-slate-300 transition hover:text-acc-1";

export default function Footer() {
  return (
    <footer id="footer" className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-md">
      {/* animated top line */}
      <div className="shine-line absolute inset-x-0 top-0 h-px" />

      {/* call to action */}
      <div className="mx-auto max-w-7xl px-6 pt-20">
        <div className="tile flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center md:p-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Got a security challenge?
            </h2>
            <p className="mt-3 text-base text-slate-300">
              I would love to hear about it. Send a message and let&apos;s find the weak spots
              before someone else does.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {CONTACT.email && (
              <Magnetic>
                <a
                  href={"mailto:" + CONTACT.email}
                  className="inline-block rounded-lg bg-gradient-to-r from-acc-1 to-acc-2 px-6 py-3 text-sm font-extrabold text-black shadow-[0_0_24px_rgba(34,211,238,0.4)] transition hover:brightness-110"
                >
                  Email me
                </a>
              </Magnetic>
            )}
            <Magnetic>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-acc-1 hover:bg-acc-1/10"
              >
                Download CV
              </a>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* columns */}
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-acc-1/40 bg-acc-1/10 text-acc-1">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className="text-lg font-extrabold text-white">{NAME}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-300">
            Offensive security, red teaming and vulnerability assessment. Learning in the lab,
            applying it in the field.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-acc-1/30 bg-acc-1/10 px-3 py-1 text-xs text-acc-1">
            <span className="h-1.5 w-1.5 rounded-full bg-acc-1" />
            Open to work
          </p>
        </div>

        <div>
          <h3 className={colTitle}>Navigate</h3>
          <ul className="space-y-2.5">
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a href={"#" + id} className={link}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={colTitle}>Connect</h3>
          <ul className="space-y-2.5">
            {CONNECT.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  target={c.label === "Email" ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className={link}
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
          <SocialLinks className="mt-5" size={18} />
        </div>

        <div>
          <h3 className={colTitle}>Built with</h3>
          <ul className="flex flex-wrap gap-2">
            {STACK.map((s) => (
              <li
                key={s}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200"
              >
                {s}
              </li>
            ))}
          </ul>
          <a
            href={CONTACT.github + "/my-portfolio"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block text-sm text-acc-2 underline decoration-acc-2/50 underline-offset-4 transition hover:text-white"
          >
            View the source code
          </a>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-slate-400 md:flex-row md:items-center">
          <p>
            &copy; {new Date().getFullYear()} {NAME}. All rights reserved.
          </p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <LiveClock />
            <span>
              <kbd className="rounded border border-white/15 px-1.5">Ctrl K</kbd> search
            </span>
            <span>
              <kbd className="rounded border border-white/15 px-1.5">Ctrl /</kbd> terminal
            </span>
            <a href="#top" className="text-slate-300 transition hover:text-acc-1">
              Back to top
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
