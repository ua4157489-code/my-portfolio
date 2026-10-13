"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import PageNav from "@/components/PageNav";

// re-runs on every navigation: the new page fades in (opacity only, so fixed panels stay put)
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
      <PageNav />
    </motion.div>
  );
}
