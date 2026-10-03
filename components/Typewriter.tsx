"use client";

import { useEffect, useState } from "react";

export default function Typewriter({
  phrases,
  className,
}: {
  phrases: string[];
  className?: string;
}) {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = phrases[index % phrases.length];
    const delay = !deleting && text === full ? 1800 : deleting ? 35 : 80;

    const t = setTimeout(() => {
      if (!deleting && text === full) {
        setDeleting(true);
      } else if (deleting && text === "") {
        setDeleting(false);
        setIndex(index + 1);
      } else {
        setText(
          deleting ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1)
        );
      }
    }, delay);

    return () => clearTimeout(t);
  }, [text, deleting, index, phrases]);

  return (
    <span className={className}>
      {text}
      <span className="animate-pulse">▌</span>
    </span>
  );
}
