export type Skill = { name: string; sources: string[] };
export type SkillGroup = { group: string; icon: string; skills: Skill[] };
export type FlatSkill = Skill & { group: string; icon: string };

const TKXEL = "Red Team Intern at Tkxel";
const ALNAFI = "Al Nafi International College";
const RUKHSANA = "Rukhsana Foundation";
const LUMS = 'LUMS Math Circle – "Mystery Hunters: Cracking Secret Enigmas"';
const ICT = "ICT Fundamentals and Data Management";

// where each skill was used or learned (the colored dots)
export const SOURCES = [
  { id: TKXEL, short: "Tkxel", dot: "bg-pink-500" },
  { id: ALNAFI, short: "Al Nafi", dot: "bg-green-400" },
  { id: RUKHSANA, short: "Rukhsana Foundation", dot: "bg-amber-400" },
  { id: LUMS, short: "LUMS Math Circle", dot: "bg-purple-400" },
  { id: ICT, short: "ICT & Data Mgmt", dot: "bg-cyan-400" },
];

export const dotOf = (id: string) =>
  SOURCES.find((x) => x.id === id)?.dot ?? "bg-green-400";

const s = (name: string, ...sources: string[]): Skill => ({ name, sources });

export const SKILL_GROUPS: SkillGroup[] = [
  {
    group: "Offensive Security",
    icon: "🔴",
    skills: [
      s("Red Teaming", TKXEL),
      s("Penetration Testing", TKXEL, ALNAFI),
      s("Ethical Hacking", TKXEL, ALNAFI),
      s("Web Application Security", TKXEL, ALNAFI),
      s("Vulnerability Assessment", ALNAFI),
      s("OWASP", ALNAFI),
    ],
  },
  {
    group: "Defensive & Monitoring",
    icon: "🛡️",
    skills: [
      s("Cybersecurity", TKXEL, ALNAFI),
      s("Information Security", ALNAFI),
      s("Network Security", ALNAFI),
      s("SIEM", ALNAFI),
      s("Wazuh", ALNAFI),
      s("Elastic Stack (ELK)", ALNAFI),
      s("SOC", ALNAFI),
      s("Incident Handling", ALNAFI),
      s("PCI DSS", ALNAFI),
    ],
  },
  {
    group: "Tools",
    icon: "🧰",
    skills: [s("Nmap"), s("Burp Suite"), s("OWASP ZAP"), s("Wireshark"), s("Metasploit")],
  },
  {
    group: "Systems, Cloud & Networking",
    icon: "☁️",
    skills: [
      s("Linux System Administration", ALNAFI),
      s("Red Hat Enterprise Linux (RHEL)", ALNAFI),
      s("Bash", ALNAFI),
      s("Networking", ALNAFI),
      s("Cloud Computing", ALNAFI),
      s("Microsoft Azure", ALNAFI),
      s("Docker", ALNAFI),
      s("SCADA", ALNAFI),
      s("Internet of Things (IoT)", ALNAFI),
    ],
  },
  {
    group: "Development & Data",
    icon: "🐍",
    skills: [
      s("Python", ALNAFI, ICT),
      s("Git", ALNAFI),
      s("GitHub", ALNAFI),
      s("GitLab", ALNAFI),
      s("HTML"),
      s("CSS"),
      s("MySQL", ALNAFI, ICT),
      s("Data Management", ICT),
      s("ICT Fundamentals", ICT),
    ],
  },
  {
    group: "Creative & Media",
    icon: "🎨",
    skills: [
      s("Adobe Photoshop", RUKHSANA),
      s("Adobe Illustrator", RUKHSANA),
      s("Adobe Premiere Pro", RUKHSANA),
      s("After Effects", RUKHSANA),
      s("CapCut"),
    ],
  },
  {
    group: "Thinking & Problem Solving",
    icon: "🧠",
    skills: [
      s("Critical Thinking", LUMS),
      s("Collaborative Problem Solving", LUMS),
      s("Mathematics", LUMS),
    ],
  },
];

export const FLAT: FlatSkill[] = SKILL_GROUPS.flatMap((g) =>
  g.skills.map((k) => ({ ...k, group: g.group, icon: g.icon }))
);
