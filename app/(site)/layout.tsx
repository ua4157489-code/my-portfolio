import PageBackground from "@/components/backgrounds/PageBackground";
import HideOn from "@/components/HideOn";
import Enhance from "@/components/Enhance";
import type { ReactNode } from "react";
import SettingsPanel from "@/components/SettingsPanel";
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
import HashLinks from "@/components/HashLinks";
import Footer from "@/components/Footer";

// Everything here stays mounted while visitors move between pages,
// so the 3D world and navbar never reload.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative font-mono text-slate-200">
      <BootScreen />
      <div className="crt" />
      <CustomCursor />
      <Spotlight />
      <FX />
      <HideOn paths={["/about", "/experience", "/education", "/skills", "/projects", "/contact"]}><World /></HideOn>
      <PageBackground />
      <Enhance />

      <Navbar />
      <SettingsPanel />
      <CommandPalette />
      <ScrollBar />
      <BackToTop />
      <TerminalWidget />
      <HashLinks />

      {children}
      <Footer />
    </main>
  );
}
