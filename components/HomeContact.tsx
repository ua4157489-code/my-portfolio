"use client";

import { useState } from "react";
import Link from "next/link";
import { Section } from "@/components/HomeKit";
import Magnetic from "@/components/Magnetic";
import { CONTACT } from "@/data/content";

export default function HomeContact() {
  const [msg, setMsg] = useState("");

  const copy = async () => {
    if (!CONTACT.email) return setMsg("Email is not set yet");
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setMsg("Email copied");
    } catch {
      setMsg("Could not copy");
    }
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <Section id="home-contact" side="left" wide>
      <div className="glow-border p-8 md:p-12">
        <p className="text-sm font-semibold tracking-wide text-cyan-300">Let&apos;s talk</p>
        <h2 className="name-gradient mt-3 text-4xl font-black leading-tight md:text-6xl">
          Want to work together on something secure?
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200">
          Security testing, labs or a project: send a message and I will reply.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Magnetic>
            <Link
              href="/contact"
              className="inline-block rounded-xl bg-gradient-to-r from-cyan-300 to-violet-400 px-7 py-3.5 text-sm font-extrabold text-black shadow-[0_0_30px_rgba(34,211,238,0.45)] transition hover:brightness-110"
            >
              Send a message
            </Link>
          </Magnetic>
          <button
            onClick={copy}
            className="rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-300"
          >
            {msg || "Copy my email"}
          </button>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-dashed border-white/25 px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-pink-300"
          >
            Download CV
          </a>
        </div>
      </div>
    </Section>
  );
}
