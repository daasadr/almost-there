"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Měření návštěvnosti.
 *
 * Umami běží na našem serveru a ukládá do naší databáze — návštěvy
 * neodcházejí nikam ven. Neukládá nic do prohlížeče, nepřiřazuje
 * návštěvy ke konkrétnímu člověku a nesleduje ho napříč weby. Vidíme
 * počty, odkud lidé přišli a které stránky si otevřeli. Nic víc.
 *
 * Proto se na to taky nemusí ptát cookie lišta: souhlas podle ePrivacy
 * potřebuje to, co si něco uloží do zařízení nebo si tam něco přečte.
 * Tohle ani jedno nedělá.
 *
 * Kdyby někdy přibylo měření, které si do prohlížeče něco ukládá, musí
 * se souhlas vrátit: skript se pak smí načíst až po něm, do `legal.ts`
 * se vrátí souhlas jako právní základ a ze značky o cookies (viz
 * `CookieNotice.tsx`) se zase musí stát volba, ne oznámení. Je to tedy
 * tři místa, ne jedno — a proto se to nemá udělat jen tak mimochodem.
 *
 * ── Uvnitř aplikace se neměří ────────────────────────────────────────
 *
 * Skript se vykreslí jen na veřejných stránkách. Za přihlášením je to
 * soukromá práce na vlastních cílech, ne návštěvnost, a pro marketing
 * z ní nic nepotřebujeme. Tahle hranice je schválně ostrá, aby se
 * nedala rozmazat omylem.
 *
 * ── Ruční sledování ──────────────────────────────────────────────────
 *
 * `data-auto-track="false"` vypíná automatické hlášení. Kdyby bylo
 * zapnuté, začal by skript po přechodu do aplikace hlásit i její
 * stránky — komponenta se sice odpojí, ale posluchač v už načteném
 * skriptu běží dál. Takhle se pošle jen to, co pošleme sami.
 */

/** Části aplikace, které se neměří. Bez jazykové předpony. */
const PRIVATE = ["/app", "/admin"];

declare global {
  interface Window {
    umami?: { track: (name?: string, data?: Record<string, unknown>) => void };
  }
}

function isPrivate(pathname: string): boolean {
  // Cesta začíná jazykem: /cs/app/... Odloupneme ho, ať se pravidlo
  // píše jednou, ne pro každý jazyk.
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  return PRIVATE.some(
    (prefix) =>
      withoutLocale === prefix || withoutLocale.startsWith(`${prefix}/`),
  );
}

export function Analytics({
  websiteId,
  scriptUrl,
}: {
  websiteId: string;
  scriptUrl: string;
}) {
  const pathname = usePathname();
  const skip = isPrivate(pathname);

  useEffect(() => {
    if (skip) return;
    // Skript se načítá asynchronně; než dorazí, `umami` neexistuje.
    // První zobrazení se pak nahlásí až při další navigaci, což je
    // přijatelná daň za to, že se nečeká na skript před vykreslením.
    window.umami?.track();
  }, [pathname, skip]);

  if (skip) return null;

  return (
    <Script
      src={scriptUrl}
      data-website-id={websiteId}
      data-auto-track="false"
      strategy="afterInteractive"
    />
  );
}

/**
 * Nahlášení události, například spuštěného dema.
 *
 * Mlčí, když měření neběží — ve vývoji, u nenastavené proměnné nebo
 * když skript zablokuje rozšíření v prohlížeči. Událost, která se
 * nepovede odeslat, nesmí shodit akci, u které vznikla.
 */
export function trackEvent(name: string): void {
  try {
    window.umami?.track(name);
  } catch {
    // Měření je vedlejší. Nic, co na něm závisí, tu nestojí.
  }
}
