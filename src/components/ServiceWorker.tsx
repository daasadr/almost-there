"use client";

import { useEffect } from "react";

/**
 * Registrace service workeru.
 *
 * Jen v produkci. Ve vývoji by mezipaměť schovávala právě provedené
 * změny a půlka ladění by šla na to, proč se nová verze neprojevila.
 *
 * Registruje se až po načtení stránky, ne během něj — stahování
 * workeru by jinak soutěžilo o pásmo s tím, co uživatel právě chce
 * vidět.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        // Bez service workeru appka funguje dál, jen bez offline stránky.
        console.error("[pwa] service worker se nepodařilo zaregistrovat", error);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
