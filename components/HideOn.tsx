"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function HideOn({
  paths,
  children,
}: {
  paths: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  return paths.includes(pathname) ? null : <>{children}</>;
}
