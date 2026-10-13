import { SKILL_GROUPS } from "./skills";
export const NAME = "Umar Ali";
export const TITLE = "Cybersecurity & DevOps";

// TODO: replace with your own words

// TODO: keep only what's true for you

// TODO: write a real one-line description for each project
export const PROJECTS = [
  {
    name: "vulnlens",
    description:
      "Reads results from multiple vulnerability scanners and converts them into one normalized data model. It gives you clean terminal summaries and JSON exports. The same issue always gets the same stable ID, so you can track what is new and what is fixed between scans.",
    tags: ["Python", "Security", "Vulnerability Assessment", "CLI"],
    href: "https://github.com/ua4157489-code/vulnlens",
  },
  {
    name: "Cybersecurity-DevOps-Labs",
    description:
      "A hands-on cybersecurity and DevOps lab portfolio. It documents Linux, SIEM, threat hunting, vulnerability assessment, cloud, Docker, Python, automation and security frameworks through practical labs and real-world scenarios.",
    tags: ["DevOps", "Labs", "Linux", "Docker", "OWASP", "MITRE ATT&CK"],
    href: "https://github.com/ua4157489-code/Cybersecurity-DevOps-Labs",
    modules: [
      { folder: "Linux_DeepDive", label: "Linux Deep Dive", note: "Up to Lab 30: SSH Basics" },
      { folder: "Python_DeepDive", label: "Python Deep Dive" },
      { folder: "Docker", label: "Docker", note: "With terminal screenshots" },
      { folder: "Container", label: "Containers & Kubernetes", note: "Kubernetes module, labs 18-20" },
      { folder: "Vulnerability-Assessment", label: "Vulnerability Assessment" },
      { folder: "DVWA", label: "DVWA", note: "Vulnerability portfolio matrix" },
      { folder: "OWASP-Top-10", label: "OWASP Top 10", note: "All 10 labs complete" },
      { folder: "MITRE-ATTACK-Labs", label: "MITRE ATT&CK Labs", note: "Includes T1027.010 command obfuscation" },
      { folder: "Red-Team-Labs", label: "Red Team Labs" },
      { folder: "CISTop20_ControlsLabs", label: "CIS Top 20 Controls" },
    ],
  },
];

// Leave a value empty ("") to hide that link

// TODO: edit these, they cycle in the typing line under your name
export const ROLES = [
  "Cybersecurity & DevOps",
  "Building secure pipelines",
  "Learning by breaking things (in labs)",
];

export const EDUCATION = [
  {
    degree: "Diploma in Cloud Cyber Security",
    school: "Al Nafi International College",
    period: "Aug 2025 - Jul 2026",
    details: ["Field of study: Cyber Security"],
  },
  {
    degree: "FSC, Pre-Engineering",
    school: "Rukhsana Foundation",
    period: "",
    details: [],
  },
];

export const ABOUT = [
  "I am a cybersecurity enthusiast focused on Offensive Security, Red Teaming, and Vulnerability Assessment, with a strong interest in identifying and understanding real-world security weaknesses.",
  "I have hands-on experience working with Linux, Python, Docker, Git/GitHub, Nmap, Burp Suite, OWASP ZAP, Wireshark, Metasploit, and Wazuh, along with practical cybersecurity labs covering web application security, network security, vulnerability assessment, SIEM, and incident response.",
  "Currently, I am building a structured cybersecurity portfolio through hands-on labs and security projects, with a focus on developing practical skills in reconnaissance, vulnerability discovery, web application testing, exploitation concepts, security monitoring, and reporting.",
  "I am particularly interested in Red Team operations and offensive security, while continuing to strengthen my foundations in networking, Linux, scripting, cloud security, and defensive security.",
  "I am always looking for opportunities to learn from experienced security professionals, work on real-world security challenges, and contribute to a professional cybersecurity team.",
];

export const CORE_AREAS = [
  { icon: "🔴", label: "Offensive Security & Red Teaming" },
  { icon: "🌐", label: "Web Application Security" },
  { icon: "🔍", label: "Vulnerability Assessment" },
  { icon: "🐧", label: "Linux & Networking" },
  { icon: "🛡️", label: "SIEM & Security Monitoring" },
  { icon: "🐍", label: "Python & Automation" },
  { icon: "☁️", label: "Cloud Security" },
  { icon: "📊", label: "Security Documentation & Reporting" },
];


export const CONTACT = {
  email: "ua4157489@gmail.com",
  github: "https://github.com/ua4157489-code",
  linkedin: "https://www.linkedin.com/in/umar-ali-ba935031b/",
  instagram: "https://www.instagram.com/wdym_.umrii/",
  facebook: "https://www.facebook.com/wdymumrii7",
};

export const SKILLS = SKILL_GROUPS.map((g) => ({
  group: g.group,
  items: g.skills.map((s) => s.name),
}));

// TODO: fill in period, summary and highlights. Empty fields stay hidden on the site.
export const EXPERIENCE = [
  {
    role: "Red Team Intern",
    company: "Tkxel",
    period: "", // for example "Jun 2026 - Aug 2026"
    summary: "", // one or two sentences about what you did
    highlights: [] as string[], // bullet points, for example "Tested web apps for OWASP Top 10 issues"
  },
];
