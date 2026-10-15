import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";

// One tall part of the Home page. The text sits on one side and the 3D sculpture moves to the other.
export function Section({
  id,
  side = "left",
  wide = false,
  children,
}: {
  id: string;
  side?: "left" | "right" | "center";
  wide?: boolean;
  children: ReactNode;
}) {
  const justify = side === "right" ? "justify-end" : side === "center" ? "justify-center" : "justify-start";
  return (
    <section id={id} className="relative z-10 flex min-h-screen items-center px-6 py-28">
      <div className={`mx-auto flex w-full max-w-7xl ${justify}`}>
        <div className={`w-full ${wide ? "max-w-5xl" : "max-w-2xl"}`}>{children}</div>
      </div>
    </section>
  );
}

export function Heading({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <Reveal>
      <p className="text-sm font-semibold tracking-wide text-cyan-300">{kicker}</p>
      <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-white md:text-6xl">{title}</h2>
      {text && <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">{text}</p>}
    </Reveal>
  );
}
