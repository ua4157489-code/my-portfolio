"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Section, Heading } from "@/components/HomeKit";
import { NAME, ROLES, ABOUT, PROJECTS, EXPERIENCE, EDUCATION, CONTACT } from "@/data/content";
import { SKILL_GROUPS } from "@/data/skills";
import { PAGES } from "@/data/pages";

type Line = { id: number; kind: "in" | "out" | "err"; text: string };

const COMMANDS = [
  "help", "whoami", "about", "skills", "projects", "experience", "education",
  "contact", "ls", "goto", "resume", "date", "clear", "sudo",
];
const CHIPS = ["help", "whoami", "skills", "projects", "contact", "goto skills"];

export default function HomeTerminal() {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([
    { id: 0, kind: "out", text: "Welcome. This terminal really works. Type help to see what it can do." },
  ]);
  const [value, setValue] = useState("");
  const hist = useRef<string[]>([]);
  const hi = useRef(0);
  const nextId = useRef(1);
  const box = useRef<HTMLDivElement>(null);
  const inp = useRef<HTMLInputElement>(null);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lines]);

  const mk = (kind: Line["kind"], text: string): Line => ({ id: nextId.current++, kind, text });

  const exec = (raw: string) => {
    const cmd = raw.trim();
    const add: Line[] = [mk("in", cmd)];
    const out = (rows: string[]) => rows.forEach((t) => add.push(mk("out", t)));
    const err = (t: string) => add.push(mk("err", t));

    if (cmd) {
      hist.current.push(cmd);
      hi.current = hist.current.length;
      const [c, ...rest] = cmd.split(/\s+/);
      const arg = rest.join(" ").toLowerCase();
      switch (c.toLowerCase()) {
        case "help":
          out([
            "whoami       who I am",
            "about        a short bio",
            "skills       skills by category",
            "projects     what I have built",
            "experience   where I have worked",
            "education    where I studied",
            "contact      how to reach me",
            "ls           list the pages",
            "goto <page>  open a page (for example: goto skills)",
            "resume       open my CV",
            "clear        clear the screen",
            "Tip: Tab completes a command, the arrow keys bring back old ones.",
          ]);
          break;
        case "whoami":
          out([`${NAME}`, `${ROLES.join(" | ")}`]);
          break;
        case "about":
          out([ABOUT[0]]);
          break;
        case "skills":
          out(SKILL_GROUPS.map((g) => `${g.icon} ${g.group} (${g.skills.length}): ${g.skills.slice(0, 4).map((s) => s.name).join(", ")}`));
          break;
        case "projects":
          out(PROJECTS.map((p) => `${p.name}: ${p.href}`));
          break;
        case "experience":
          out(EXPERIENCE.map((e) => `${e.role} at ${e.company}${e.period ? " (" + e.period + ")" : ""}`));
          break;
        case "education":
          out(EDUCATION.map((e) => `${e.degree}, ${e.school}${e.period ? " (" + e.period + ")" : ""}`));
          break;
        case "contact": {
          const rows = [
            CONTACT.email && `email:    ${CONTACT.email}`,
            CONTACT.github && `github:   ${CONTACT.github}`,
            CONTACT.linkedin && `linkedin: ${CONTACT.linkedin}`,
          ].filter(Boolean) as string[];
          out(rows.length ? rows : ["No contact details are set yet."]);
          break;
        }
        case "ls":
          out([PAGES.map((p) => p.id + "/").join("  ")]);
          break;
        case "goto":
        case "open":
        case "cd": {
          const page = PAGES.find((p) => p.id === arg.replace(/\/$/, ""));
          if (page) {
            out([`Opening /${page.id} ...`]);
            setTimeout(() => router.push(`/${page.id}`), 450);
          } else err(`No such page: ${arg || "(none)"}. Try ls.`);
          break;
        }
        case "resume":
        case "cv":
          out(["Opening resume.pdf ..."]);
          window.open("/resume.pdf", "_blank", "noopener,noreferrer");
          break;
        case "date":
          out([new Date().toString()]);
          break;
        case "clear":
          setLines([]);
          return;
        case "sudo":
          err("Permission denied. Nice try.");
          break;
        default:
          err(`command not found: ${c}. Type help.`);
      }
    }
    setLines((l) => [...l, ...add]);
  };

  const submit = (raw: string) => {
    exec(raw);
    setValue("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit(value);
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      hi.current = Math.max(0, hi.current - 1);
      setValue(hist.current[hi.current] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      hi.current = Math.min(hist.current.length, hi.current + 1);
      setValue(hist.current[hi.current] ?? "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const m = COMMANDS.find((c) => value && c.startsWith(value.toLowerCase()));
      if (m) setValue(m);
    }
  };

  return (
    <Section id="home-terminal" side="right">
      <Heading
        kicker="Try it yourself"
        title="Talk to my portfolio"
        text="A working command line. Ask it who I am, list my skills, or jump to any page."
      />

      <div className="glow-border mt-8 overflow-hidden" onClick={() => inp.current?.focus()}>
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          <span className="ml-2">visitor@portfolio:~</span>
        </div>

        <div ref={box} className="term-scroll h-72 space-y-1 overflow-y-auto px-4 py-3 text-sm">
          {lines.map((l) => (
            <p
              key={l.id}
              className={`whitespace-pre-wrap break-words ${
                l.kind === "in" ? "text-white" : l.kind === "err" ? "text-pink-300" : "text-cyan-100"
              }`}
            >
              {l.kind === "in" && <span className="text-green-400">$ </span>}
              {l.text}
            </p>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-sm">
          <span className="text-green-400">$</span>
          <input
            ref={inp}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            aria-label="Terminal command"
            placeholder="type a command, then Enter"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => submit(c)}
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-300 hover:text-white"
          >
            {c}
          </button>
        ))}
      </div>
    </Section>
  );
}
