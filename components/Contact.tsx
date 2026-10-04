"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { CONTACT } from "@/data/content";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const field =
  "w-full rounded border bg-black/60 px-4 py-3 text-sm text-green-100 placeholder:text-green-800 focus:outline-none focus:shadow-[0_0_20px_rgba(0,255,156,0.15)]";

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
    if (form.name.trim().length < 2) e.name = "Please enter your name";
    if (!emailRe.test(form.email.trim())) e.email = "Enter a valid email address";
    if (form.message.trim().length < 10) e.message = "Message should be at least 10 characters";
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
    errors[k] ? "border-red-500/70" : "border-green-900 focus:border-green-400";

  return (
    <section id="contact" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <Reveal>
        <h2 className="glow mb-10 text-3xl font-bold text-green-400">
          <span className="text-green-700">$ </span>contact
        </h2>

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="mb-6 text-lg leading-relaxed text-green-100">
              Want to talk security, red teaming, or work together? Send a message, or reach me
              directly.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyEmail}
                className="rounded border border-green-400 px-5 py-2 text-sm text-green-300 transition hover:bg-green-400 hover:text-black"
              >
                Copy email
              </button>
              {CONTACT.github && (
                <a
                  href={CONTACT.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-cyan-300 px-5 py-2 text-sm text-cyan-200 transition hover:bg-cyan-300 hover:text-black"
                >
                  GitHub
                </a>
              )}
              {CONTACT.linkedin && (
                <a
                  href={CONTACT.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-cyan-300 px-5 py-2 text-sm text-cyan-200 transition hover:bg-cyan-300 hover:text-black"
                >
                  LinkedIn
                </a>
              )}
            </div>
            {!CONTACT.email && (
              <p className="mt-6 rounded border border-yellow-500/40 bg-yellow-500/5 p-3 text-xs text-yellow-300">
                Your email is not set yet. Add it as <code>CONTACT.email</code> in{" "}
                <code>data/content.ts</code> to enable sending and copying.
              </p>
            )}
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className={`${field} ${border("name")}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>
            <div>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Your email"
                className={`${field} ${border("email")}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>
            <div>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Your message"
                rows={5}
                maxLength={500}
                className={`${field} ${border("message")} resize-none`}
              />
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-red-400">{errors.message}</span>
                <span className="text-green-700">{form.message.length}/500</span>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded bg-gradient-to-r from-green-400 to-cyan-400 px-6 py-3 font-bold text-black shadow-[0_0_20px_rgba(0,255,156,0.4)] transition hover:brightness-110"
            >
              Send message →
            </button>
          </form>
        </div>
      </Reveal>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded border border-green-400/40 bg-black/90 px-4 py-2 text-sm text-green-200 shadow-[0_0_30px_rgba(0,255,156,0.2)]">
          {toast}
        </div>
      )}
    </section>
  );
}
