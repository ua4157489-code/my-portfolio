import type { CSSProperties } from "react";
import { FaFacebookF, FaGithub, FaInstagram, FaLinkedinIn } from "react-icons/fa6";
import { SiGmail } from "react-icons/si";

const LINKS = [
  { label: "Email", href: "mailto:ua4157489@gmail.com", Icon: SiGmail, color: "#EA4335", hoverText: "#ffffff" },
  { label: "GitHub", href: "https://github.com/ua4157489-code", Icon: FaGithub, color: "#e6edf3", hoverText: "#0d1117" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/umar-ali-ba935031b/", Icon: FaLinkedinIn, color: "#0A66C2", hoverText: "#ffffff" },
  {
    label: "Instagram",
    href: "https://www.instagram.com/wdym_.umrii/",
    Icon: FaInstagram,
    color: "#E1306C",
    hoverText: "#ffffff",
    bg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
  },
  { label: "Facebook", href: "https://www.facebook.com/wdymumrii7", Icon: FaFacebookF, color: "#1877F2", hoverText: "#ffffff" },
];

export default function BrandLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-3 ${className}`}>
      {LINKS.map(({ label, href, Icon, color, hoverText, bg }) => (
        <li key={label} className="group/tip relative">
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            aria-label={label}
            className="flex h-12 w-12 items-center justify-center rounded-full border bg-black/40 text-[var(--c)] transition duration-300 hover:-translate-y-1.5 hover:scale-110 hover:text-[var(--t)] hover:[background:var(--bg)] hover:shadow-[0_8px_28px_var(--glow)]"
            style={
              {
                "--c": color,
                "--t": hoverText,
                "--bg": bg ?? color,
                "--glow": `${color}99`,
                borderColor: `${color}55`,
              } as CSSProperties
            }
          >
            <Icon className="text-xl" />
          </a>
          <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 font-mono text-[11px] text-white opacity-0 transition duration-200 group-hover/tip:-translate-y-1 group-hover/tip:opacity-100">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
