// The 3D world is a long avenue. Each page section is one "chapter":
// the camera flies forward as you scroll and passes through a gate at every chapter.

export const ORDER = [
  "top",
  "about",
  "experience",
  "education",
  "skills",
  "projects",
  "contact",
];

export const TITLES = [
  "Start",
  "About",
  "Experience",
  "Education",
  "Skills",
  "Projects",
  "Contact",
];

// distance between two chapters along the avenue
export const GAP = 60;

// where the gate of chapter i stands
export const gateZ = (i: number) => -i * GAP - 6;

// where the camera rests when chapter i is centered on screen
export const camZ = (i: number) => 8 - i * GAP;
