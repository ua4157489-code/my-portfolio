"use client";

import { useState } from "react";
import SplitSection from "@/components/SplitSection";
import SocialLinks from "@/components/SocialLinks";
import Reveal from "@/components/Reveal";
import { CONTACT } from "@/data/content";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const field =
  "w-full border-0 border-b-2 bg-transparent px-0 py-3 text-lg text-white placeholder:text-slate-400 transition-colors focus:outline-none";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Enter your name";
    if (!emailRe.test(form.email.trim())) e.email = "Enter a valid email address";
    if (form.message.trim().length < 10) e.message = "Write at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!CONTACT.email) {
      flash("Set your email in data/content.ts first");
      return;
    }
    const subject = encodeURIComponent(`Portfolio message from ${form.name.trim()}`);
    const body = encodeURIComponent(
      `${form.message.trim()}\n\n- ${form.name.trim()} (${form.email.trim()})`
    );
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    flash("Opening your email app...");
  };

  const copyEmail = async () => {
    if (!CONTACT.email) return flash("Email not set yet");
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      flash("Email copied");
    } catch {
      flash("Could not copy");
    }
  };

  const border = (k: string) =>
    errors[k] ? "border-red-500" : "border-white/20 focus:border-[var(--accent)]";

  return (
    <SplitSection id="contact">
      <Reveal>
        <h3 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-7xl">
          Got something to <span className="text-[var(--accent)]">break</span>, or protect?
        </h3>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200">
          Security testing, red teaming or a project you want to build together: send a message
          and I will reply.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <button
          onClick={copyEmail}
          className="group mt-10 block text-left"
          aria-label="Copy email address"
        >
          <span className="block break-all text-2xl font-bold text-white transition group-hover:text-[var(--accent)] md:text-4xl">
            {CONTACT.email || "add-your-email@here"}
          </span>
          <span className="mt-1 block h-0.5 w-0 bg-[var(--accent)] transition-all duration-500 group-hover:w-full" />
          <span className="mt-2 block text-sm text-slate-300">Click to copy</span>
        </button>
        <SocialLinks className="mt-6" />
        {!CONTACT.email && (
          <p className="mt-6 rounded border border-yellow-500/40 bg-yellow-500/5 p-3 text-xs text-yellow-300">
            Your email is not set yet. Add it as <code>CONTACT.email</code> in{" "}
            <code>data/content.ts</code> to enable sending and copying.
          </p>
        )}
      </Reveal>

      <Reveal delay={0.15}>
        <form onSubmit={submit} noValidate className="mt-14 space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                aria-label="Your name"
                className={`${field} ${border("name")}`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>
            <div>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Your email"
                aria-label="Your email"
                className={`${field} ${border("email")}`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            </div>
          </div>
          <div>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="What would you like to talk about?"
              aria-label="Your message"
              rows={4}
              maxLength={500}
              className={`${field} ${border("message")} resize-none`}
            />
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-red-400">{errors.message}</span>
              <span className="text-slate-300">{form.message.length}/500</span>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-pink-400 px-10 py-4 text-lg font-bold text-black shadow-[0_0_30px_rgba(167,139,250,0.35)] transition hover:scale-[1.03] hover:brightness-110"
          >
            Send message
          </button>
        </form>
      </Reveal>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded border border-cyan-300/40 bg-black/90 px-4 py-2 text-sm text-white shadow-[0_0_30px_rgba(34,211,238,0.2)]">
          {toast}
        </div>
      )}
    </SplitSection>
  );
}
