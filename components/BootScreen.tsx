"use client";

import { useEffect, useState } from "react";

const LINES = [
  "[ OK ] initializing secure shell...",
  "[ OK ] loading modules: recon, defense, automation",
  "[ OK ] establishing encrypted channel",
  "[WARN] unauthorized access is logged",
  "[ OK ] access granted",
];

export default function BootScreen() {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (shown < LINES.length) {
      const t = setTimeout(() => setShown(shown + 1), 280);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone(true), 450);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div
      onClick={() => setDone(true)}
      className={`fixed inset-0 z-[100] flex cursor-pointer items-center bg-black px-8 font-mono text-sm text-green-400 transition-opacity duration-500 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="mx-auto w-full max-w-xl space-y-1">
        {LINES.slice(0, shown).map((l) => (
          <p key={l} className={l.startsWith("[WARN]") ? "text-yellow-400" : ""}>
            {l}
          </p>
        ))}
        <p className="animate-pulse">▌</p>
        <p className="pt-6 text-xs text-green-800">click to skip</p>
      </div>
    </div>
  );
}
