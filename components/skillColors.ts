import { SKILL_GROUPS } from "@/data/skills";

// one accent colour per skill category (follows the order in data/skills.ts)
const PALETTE = [
  "#ff4d9d",
  "#22d3ee",
  "#fbbf24",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fb923c",
  "#2dd4bf",
];

export const accentOf = (group: string) => {
  const i = SKILL_GROUPS.findIndex((g) => g.group === group);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
};
