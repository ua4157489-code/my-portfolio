import { NAME } from "@/data/content";

const links = ["about", "skills", "projects", "contact"];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-green-900/50 bg-black/60 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 font-mono text-sm">
        <a href="#top" className="font-bold text-green-400">
          ~/{NAME.toLowerCase().replace(" ", "-")}
        </a>
        <ul className="flex gap-4 sm:gap-6">
          {links.map((l) => (
            <li key={l}>
              <a href={`#${l}`} className="text-green-600 transition hover:text-green-300">
                {l}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
