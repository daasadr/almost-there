"use client";

import { useEffect } from "react";

/**
 * Postupné odhalení obsahu při scrollu. Jeden observer pro celou stránku
 * místo hooku v každé sekci — méně kódu i méně listenerů.
 *
 * Prvky se označují třídou `reveal`. Bez JS (nebo při prefers-reduced-motion)
 * zůstanou viditelné, protože CSS je v takovém případě nezakrývá.
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    for (const element of document.querySelectorAll(".reveal")) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
