"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PAGES } from "@/data/pages";

const IDS = new Set(PAGES.map((p) => p.id));

// Old "#skills" style links (hero buttons, footer, shortcuts) now open the matching page.
export default function HashLinks() {
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const id = (a.getAttribute("href") ?? "").slice(1);
      if (!id || document.getElementById(id)) return; // the target is on this page: normal scroll
      if (IDS.has(id)) {
        e.preventDefault();
        router.push(`/${id}`);
      } else if (id === "top") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    document.addEventListener("click", onClick);

    const h = window.location.hash.slice(1);
    if (h && IDS.has(h) && !document.getElementById(h)) router.replace(`/${h}`);

    return () => document.removeEventListener("click", onClick);
  }, [router]);

  return null;
}
