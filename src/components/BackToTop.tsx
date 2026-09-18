"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Návrat na začátek stránky.
 *
 * Některé stránky rostou víc, než se čekalo — detail cíle s celým
 * rozpadem, návod, dlouhý článek. Scrollovat zpátky nahoru palcem přes
 * celou obrazovku je otrava, a na mobilu obzvlášť.
 *
 * Ukáže se až po kusu scrollování. Kdyby visela na obrazovce hned od
 * začátku, překážela by na stránkách, které se vejdou celé — a to jsou
 * skoro všechny.
 *
 * `scrollTo` schválně bez `behavior`: výchozí hodnota znamená „řiď se
 * CSS“, a to už plynulé posouvání nastavené má — včetně toho, že se
 * vypne, když si člověk vypnul animace v systému.
 */

/** Po kolika pixelech má smysl nabízet návrat. Zhruba obrazovka a půl. */
const SHOW_AFTER = 900;

export function BackToTop() {
  const t = useTranslations("nav");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      // Scroll se spouští desetkrát za vteřinu a víc. Bez tohohle by se
      // stav přepisoval zbytečně často a na slabším telefonu by to bylo
      // znát na plynulosti.
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setVisible(window.scrollY > SHOW_AFTER);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0 })}
      aria-label={t("backToTop")}
      title={t("backToTop")}
      // Skrytá zůstává v dokumentu, jen se nedá zaměřit ani kliknout —
      // díky tomu má kam a odkud plynule přejít.
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      style={{
        // Nad ovládacím pruhem telefonu, ne pod ním.
        bottom: "calc(1.25rem + env(safe-area-inset-bottom))",
        right: "calc(1.25rem + env(safe-area-inset-right))",
      }}
      className={`card fixed z-40 grid h-11 w-11 place-items-center rounded-full shadow-2xl transition-[opacity,transform] duration-300 hover:border-edge-hover ${
        visible
          ? "translate-y-0 opacity-90 hover:opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5 fill-none stroke-[var(--color-paper)] stroke-[1.8]"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}
