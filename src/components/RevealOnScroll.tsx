"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Postupné odhalení obsahu při scrollu. Jeden observer pro celou stránku
 * místo hooku v každé sekci — méně kódu i méně listenerů.
 *
 * Prvky se označují třídou `reveal`. Bez JS (nebo při prefers-reduced-motion)
 * zůstanou viditelné, protože CSS je v takovém případě nezakrývá.
 *
 * Závislost na cestě je zásadní: komponenta žije v layoutu, a ten se při
 * přechodu mezi stránkami nevytváří znovu. S prázdnými závislostmi by se
 * observer nastavil jen při prvním načtení a obsah stránky, na kterou se
 * uživatel proklikal, by zůstal navždy neviditelný.
 */
export function RevealOnScroll() {
  const pathname = usePathname();

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
  }, [pathname]);

  return null;
}
