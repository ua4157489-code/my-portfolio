import BootScreen from "@/components/BootScreen";
import CustomCursor from "@/components/CustomCursor";
import Spotlight from "@/components/Spotlight";
import FX from "@/components/FX";
import World from "@/components/World";
import Navbar from "@/components/Navbar";
import CommandPalette from "@/components/CommandPalette";
import ScrollBar from "@/components/ScrollBar";
import BackToTop from "@/components/BackToTop";
import TerminalWidget from "@/components/TerminalWidget";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Education from "@/components/Education";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative font-mono text-slate-200">
      <BootScreen />
      <div className="crt" />
      <CustomCursor />
      <Spotlight />
      <FX />

      {/* fixed 3D world behind everything: the camera flies forward as you scroll */}
      <World />

      <Navbar />
      <CommandPalette />
      <ScrollBar />
      <BackToTop />
      <TerminalWidget />

      <Hero />
      <Marquee />
      <About />
      <Experience />
      <Education />
      <Skills />
      <Projects />
      <Contact />
      <Footer />
    </main>
  );
}
