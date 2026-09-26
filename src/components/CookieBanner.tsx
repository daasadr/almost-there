"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { readStored, writeStored } from "@/lib/safe-storage";

/**
 * Cookie lišta podle GDPR/ePrivacy: analytické cookies jde odmítnout
 * jedním kliknutím, ne jen odsouhlasit (zadání, bod 13).
 *
 * POZOR — tahle lišta dnes nic neřídí.
 *
 * Měření návštěvnosti se mezitím udělalo bez cookies: Umami běží na
 * našem serveru, neukládá nic do zařízení a nepřiřazuje návštěvy
 * k člověku. Souhlas podle ePrivacy potřebuje to, co si něco do
 * zařízení uloží nebo si tam něco přečte — a to se tu neděje. Skript
 * se proto vykresluje rovnou a `getCookieConsent()` se ho neptá; viz
 * `Analytics.tsx`.
 *
 * Zbývající cookies jsou nezbytné: přihlášení, jazyk, převzetí dema.
 * U těch se souhlas nevyžaduje.
 *
 * Z toho plyne, že lišta nabízí volbu, která už nic nemění. Je to
 * rozhodnutí k učinění, ne stav, který by měl vydržet — buď se zruší,
 * nebo se z ní stane obyčejné oznámení bez tlačítek. Do té doby tu
 * zůstává, protože zmizet má vědomě, ne omylem.
 *
 * Kdyby někdy přibylo měření, které si do prohlížeče něco ukládá, musí
 * se `getCookieConsent()` znovu začít ptát — od toho tu ta funkce je.
 */

const STORAGE_KEY = "almostthere.cookie-consent";

export type CookieConsent = "all" | "necessary";

export function getCookieConsent(): CookieConsent | null {
  const value = readStored(STORAGE_KEY);
  return value === "all" || value === "necessary" ? value : null;
}

export function CookieBanner() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Až po mountu — na serveru nevíme, co má uživatel uložené,
    // a lišta by při hydrataci probliknula.
    if (!getCookieConsent()) setVisible(true);
  }, []);

  const decide = (consent: CookieConsent) => {
    // Když se volba neuloží, lišta se stejně zavře. Zeptáme se sice
    // příště znovu, ale to je pořád lepší než lišta, kterou nejde odklidit
    // a která překrývá spodek stránky.
    writeStored(STORAGE_KEY, consent);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("title")}
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-md"
    >
      <div className="card p-5 shadow-2xl">
        <h2 className="display text-base">{t("title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-paper-dim)]">
          {t("body")}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => decide("all")}
            className="btn-primary !px-5 !py-2 text-sm"
          >
            {t("acceptAll")}
          </button>
          <button
            type="button"
            onClick={() => decide("necessary")}
            className="rounded-full border border-edge-strong px-5 py-2 text-sm font-medium text-[var(--color-paper-dim)] transition hover:border-edge-hover hover:text-[var(--color-paper)]"
          >
            {t("necessaryOnly")}
          </button>
          <Link
            href="/privacy"
            className="text-sm text-[var(--color-paper-faint)] underline underline-offset-4 transition hover:text-[var(--color-paper-dim)]"
          >
            {t("more")}
          </Link>
        </div>
      </div>
    </div>
  );
}
