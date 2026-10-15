import type { CSSProperties } from "react";
import { Section, Heading } from "@/components/HomeKit";
import { Timeline, TimelineItem } from "@/components/Timeline";
import { EXPERIENCE, EDUCATION } from "@/data/content";

// work and study on one timeline: the line fills as you scroll and each dot lights up
export default function Journey() {
  const items = [
    ...EXPERIENCE.map((e) => ({
      type: "Work",
      title: e.role,
      sub: e.company,
      period: e.period || "",
      text: e.summary || "",
      bullets: e.highlights as string[],
    })),
    ...EDUCATION.map((e) => ({
      type: "Study",
      title: e.degree,
      sub: e.school,
      period: e.period || "",
      text: "",
      bullets: e.details as string[],
    })),
  ];

  return (
    <Section id="home-journey" side="right">
      <Heading kicker="My path so far" title="Work and study" />
      <div className="mt-10" style={{ "--accent": "#a78bfa" } as CSSProperties}>
        <Timeline>
          {items.map((it) => (
            <TimelineItem key={it.type + it.title + it.sub} label={it.period || it.type}>
              <div className="tile p-6">
                <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] text-slate-200">{it.type}</span>
                <p className="mt-3 text-lg font-bold text-white">{it.title}</p>
                <p className="mt-1 text-sm text-cyan-300">{it.sub}</p>
                {it.text && <p className="mt-3 text-sm leading-relaxed text-slate-200">{it.text}</p>}
                {it.bullets.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-slate-200">
                    {it.bullets.map((b) => (
                      <li key={b}>&gt; {b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </TimelineItem>
          ))}
        </Timeline>
      </div>
    </Section>
  );
}
