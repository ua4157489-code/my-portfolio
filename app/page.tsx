import Marquee from "@/components/Marquee";
import HudFrame from "@/components/HudFrame";
import Skills from "@/components/Skills";
import BackToTop from "@/components/BackToTop";
import TerminalWidget from "@/components/TerminalWidget";
import Contact from "@/components/Contact";
import Projects from "@/components/Projects";
import About from "@/components/About";
import Hero from "@/components/Hero";
import Shatter2D from "@/components/Shatter2D";
import { EFFECTS } from "@/data/effects";
import CustomCursor from "@/components/CustomCursor";
import Scene from "@/components/Scene";
import MatrixRain from "@/components/MatrixRain";
import BootScreen from "@/components/BootScreen";
import ScrambleText from "@/components/ScrambleText";
import Typewriter from "@/components/Typewriter";
import Navbar from "@/components/Navbar";
import ScrollBar from "@/components/ScrollBar";
import Reveal from "@/components/Reveal";
import Education from "@/components/Education";
import { NAME, ROLES, ABOUT, SKILLS, PROJECTS, CONTACT } from "@/data/content";

function Heading({ children }: { children: string }) {
  return (
    <h2 className="glow mb-10 text-3xl font-bold text-green-400">
      <span className="text-green-700">$ </span>
      {children}
    </h2>
  );
}

const btn =
  "rounded border border-green-400 px-6 py-2 transition hover:bg-green-400 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,156,0.6)]";

export default function Home() {
  return (
    <main className="relative font-mono text-green-400">
      <BootScreen />
      <CustomCursor />
      {EFFECTS.scanlines && <div className="crt" />}
      <Scene />
      {EFFECTS.shatter2d && <Shatter2D />}
      {EFFECTS.matrixRain && <MatrixRain />}
      <Navbar />
      <HudFrame />
      <BackToTop />
      <TerminalWidget />
      <ScrollBar />

      <Hero />
      <Marquee />

      <div className="relative z-10">
        <About />

        <Education />

        <Skills />

        <Projects />

        <Contact />

        <footer className="border-t border-green-900/50 py-8 text-center text-xs text-green-700">
          © {new Date().getFullYear()} {NAME}
        </footer>
      </div>
    </main>
  );
}
