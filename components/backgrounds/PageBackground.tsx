"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ComponentType } from "react";

const load = (fn: () => Promise<{ default: ComponentType }>) =>
  dynamic(fn, { ssr: false });

// key = first URL segment
const SCENES: Record<string, ComponentType> = {
  about: load(() => import("./AboutBackground")),
  experience: load(() => import("./ExperienceBackground")),
  education: load(() => import("./EducationBackground")),
  skills: load(() => import("./SkillsBackground")),
  projects: load(() => import("./ProjectsBackground")),
  contact: load(() => import("./ContactBackground")),
};

export default function PageBackground() {
  const key = usePathname().split("/")[1] ?? "";
  const Scene = SCENES[key];

  return (
    <AnimatePresence mode="wait">
      {Scene && (
        <motion.div
          key={key}
          style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Scene />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
