export type PageInfo = {
  id: string;
  label: string;
  kicker: string;
  blurb: string;
  accent: string;
};

export const PAGES: PageInfo[] = [
  { id: "about", label: "About", kicker: "Who I am and what I focus on", blurb: "My background, focus areas and the tools I work with.", accent: "#22d3ee" },
  { id: "experience", label: "Experience", kicker: "Where I have worked", blurb: "Roles and the skills I used in each.", accent: "#ff4d9d" },
  { id: "education", label: "Education", kicker: "Where I studied", blurb: "Diplomas, schools and courses.", accent: "#a78bfa" },
  { id: "skills", label: "Skills", kicker: "What I can do", blurb: "Search and filter every skill by category and place.", accent: "#fbbf24" },
  { id: "projects", label: "Projects", kicker: "What I have built", blurb: "Labs and tools, with live GitHub numbers.", accent: "#22d3ee" },
  { id: "contact", label: "Contact", kicker: "Let's talk", blurb: "Send a message or reach me directly.", accent: "#a78bfa" },
];
