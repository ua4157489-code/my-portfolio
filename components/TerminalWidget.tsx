"use client";

import { useEffect, useRef, useState } from "react";
import {
  NAME,
  ROLES,
  ABOUT,
  SKILLS,
  PROJECTS,
  EDUCATION,
  CONTACT,
} from "@/data/content";

const RESUME_URL = "/resume.pdf";
const SECTIONS = ["top", "about", "education", "skills", "projects", "contact"];
const COMMANDS = [
  "help", "whoami", "about", "skills", "projects", "education", "contact",
  "ls", "cd", "clear", "neofetch", "nmap", "github", "resume", "date", "echo", "sudo",
];

type Line = { kind: "in" | "out"; text: string };

const WELCOME = [
  "Welcome to " + NAME + "'s terminal.",
  "Type 'help' to see commands. Tab completes, up/down browse history.",
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function execute(raw: string): string[] | "clear" {
  const parts = raw.trim().split(/\s+/);
  const cmd = (parts[0] || "").toLowerCase();
  const arg = parts.slice(1).join(" ");

  switch (cmd) {
    case "":
      return [];
    case "clear":
      return "clear";
    case "help":
      return [
        "Commands:",
        "  whoami              short intro",
        "  about               about me",
        "  skills              skills and tools",
        "  projects            list projects",
        "  education           education",
        "  contact             contact links",
        "  ls                  list sections",
        "  cd <section>        jump to a section (try: cd projects)",
        "  neofetch            profile summary",
        "  nmap <host>         simulated port scan, just for fun",
        "  github | resume     open links",
        "  date | echo <text>  utilities",
        "  clear               clear the screen",
      ];
    case "whoami":
      return [NAME + " - " + ROLES[0]];
    case "about":
      return ABOUT;
    case "skills":
      return SKILLS.flatMap((s) => ["[" + s.group + "]", "  " + s.items.join(", ")]);
    case "projects":
      return PROJECTS.map((p) => "- " + p.name + ": " + p.description + "\n  " + p.href);
    case "education":
      return EDUCATION.map(
        (e) => e.degree + " - " + e.school + (e.period ? " (" + e.period + ")" : "")
      );
    case "contact":
      return [
        CONTACT.email ? "email:    " + CONTACT.email : "email:    (not set yet)",
        "github:   " + CONTACT.github,
        CONTACT.linkedin ? "linkedin: " + CONTACT.linkedin : "linkedin: (not set yet)",
      ];
    case "ls":
      return [SECTIONS.map((s) => s + "/").join("  ")];
    case "cd": {
      const target = arg.replace(/^\.?\//, "").replace(/\/$/, "").toLowerCase();
      const id = target === "" || target === "~" ? "top" : target === "edu" ? "education" : target;
      if (!SECTIONS.includes(id)) return ["cd: no such section: " + arg];
      scrollToId(id);
      return ["-> ./" + id];
    }
    case "neofetch":
      return [
        NAME.toLowerCase().replace(/\s+/g, "") + "@sec",
        "-----------------",
        "Role:      " + ROLES[0],
        "Focus:     Offensive Security, Red Teaming, Vulnerability Assessment",
        "Education: " + (EDUCATION[0]?.school ?? "-"),
        "Tools:     " + (SKILLS.find((s) => s.group === "Tools")?.items.join(", ") ?? "-"),
      ];
    case "nmap": {
      const host = arg || "localhost";
      return [
        "Starting simulated scan of " + host + " (no real network traffic)",
        "PORT      STATE     SERVICE",
        "22/tcp    closed    ssh",
        "80/tcp    open      http",
        "443/tcp   open      https",
        "8080/tcp  filtered  http-proxy",
        "Scan complete: 1 host up (simulated).",
      ];
    }
    case "github":
      window.open(CONTACT.github, "_blank");
      return ["opening github..."];
    case "resume":
      window.open(RESUME_URL, "_blank");
      return ["opening resume..."];
    case "date":
      return [new Date().toString()];
    case "echo":
      return [arg];
    case "sudo":
      return ["Nice try. This incident will be reported. ;)"];
    default:
      return ["command not found: " + cmd + ". Type 'help'."];
  }
}

export default function TerminalWidget() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(() =>
    WELCOME.map((text) => ({ kind: "out" as const, text }))
  );
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl + / toggles the terminal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines, open]);

  const submit = () => {
    const raw = input;
    const result = execute(raw);
    if (raw.trim()) setHistory((h) => [...h, raw]);
    setHIdx(-1);
    setInput("");
    if (result === "clear") {
      setLines([]);
      return;
    }
    setLines((l) => [
      ...l,
      { kind: "in" as const, text: raw },
      ...result.map((text) => ({ kind: "out" as const, text })),
    ]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = hIdx === -1 ? history.length - 1 : Math.max(hIdx - 1, 0);
      setHIdx(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx === -1) return;
      const i = hIdx + 1;
      if (i >= history.length) {
        setHIdx(-1);
        setInput("");
      } else {
        setHIdx(i);
        setInput(history[i]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = COMMANDS.find((c) => input && c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle terminal"
        className="fixed bottom-6 right-6 z-[65] flex h-12 w-12 items-center justify-center rounded-full border border-green-400/50 bg-black/80 font-mono text-green-300 shadow-[0_0_20px_rgba(0,255,156,0.3)] backdrop-blur transition hover:scale-110 hover:bg-green-400 hover:text-black"
      >
        {open ? "×" : ">_"}
      </button>

      {open && (
        <div
          onClick={() => inputRef.current?.focus()}
          className="fixed bottom-24 right-6 z-[65] flex h-[380px] w-[min(92vw,540px)] flex-col overflow-hidden rounded-xl border border-green-400/30 bg-black/90 font-mono text-sm shadow-[0_0_60px_rgba(0,255,156,0.15)] backdrop-blur-md"
        >
          <div className="flex items-center gap-2 border-b border-green-400/20 px-4 py-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2 text-cyan-300/80">
              {NAME.toLowerCase().replace(/\s+/g, "")}@sec: ~
            </span>
            <span className="ml-auto text-slate-500">Ctrl + / to toggle</span>
          </div>

          <div ref={bodyRef} className="flex-1 space-y-1 overflow-y-auto p-4">
            {lines.map((l, i) => (
              <div key={i} className={l.kind === "in" ? "text-white" : "text-green-300"}>
                {l.kind === "in" && <span className="text-green-500">$ </span>}
                <span className="whitespace-pre-wrap break-words">{l.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-green-400/20 px-4 py-3">
            <span className="text-green-500">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoComplete="off"
              placeholder="type a command..."
              className="w-full bg-transparent text-white placeholder:text-slate-600 focus:outline-none"
            />
          </div>
        </div>
      )}
    </>
  );
}
