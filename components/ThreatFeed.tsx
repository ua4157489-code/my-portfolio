"use client";

import { useEffect, useRef, useState } from "react";

type Tag = "BLOCKED" | "ALERT" | "OK";
type Row = { id: number; tag: Tag; ip: string; text: string };

// reserved documentation ranges: these addresses never belong to real machines
const RANGES = ["203.0.113", "198.51.100", "192.0.2"];

const EVENTS: { tag: Tag; text: string }[] = [
  { tag: "BLOCKED", text: "SSH brute force on :22" },
  { tag: "BLOCKED", text: "SQL injection on /login" },
  { tag: "ALERT", text: "Port scan detected" },
  { tag: "ALERT", text: "Odd PowerShell child process" },
  { tag: "OK", text: "Patch window verified" },
  { tag: "BLOCKED", text: "XSS probe on /search" },
  { tag: "OK", text: "TLS 1.3 handshake" },
  { tag: "ALERT", text: "Beacon to a rare domain" },
];

const TAG_STYLE: Record<Tag, string> = {
  BLOCKED: "text-acc-3",
  ALERT: "text-acc-4",
  OK: "text-acc-1",
};

export default function ThreatFeed() {
  const [rows, setRows] = useState<Row[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const add = () => {
      const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      const range = RANGES[Math.floor(Math.random() * RANGES.length)];
      const ip = range + "." + (1 + Math.floor(Math.random() * 253));
      counter.current += 1;
      const row: Row = { id: counter.current, tag: ev.tag, ip, text: ev.text };
      setRows((r) => [...r.slice(-5), row]);
    };
    add();
    const id = setInterval(add, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-[22rem] overflow-hidden rounded-xl border border-white/10 bg-black/60 font-mono text-xs shadow-[0_0_40px_rgba(167,139,250,0.12)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="flex items-center gap-2 text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acc-3 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-acc-3" />
          </span>
          Live event feed
        </span>
        <span className="text-[10px] text-slate-500">simulated</span>
      </div>
      <ul className="space-y-1.5 px-4 py-3">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className="flex gap-2 transition-opacity"
            style={{ opacity: 0.35 + (0.65 * (i + 1)) / rows.length }}
          >
            <span className={`w-16 shrink-0 font-bold ${TAG_STYLE[r.tag]}`}>{r.tag}</span>
            <span className="text-slate-400">{r.ip}</span>
            <span className="truncate text-slate-200">{r.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
