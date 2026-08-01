"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Cookie lišta podle GDPR/ePrivacy: analytické cookies jde odmítnout
 * jedním kliknutím, ne jen odsouhlasit (zadání, bod 13).
 *
 * Analytika se zatím nikde nenačítá — až přijde, musí kontrolovat
 * `getCookieConsent()` a spustit se teprve po souhlasu, ne předem.
 */

const STORAGE_KEY = "almostthere.cookie-consent";

export type CookieConsent = "all" | "necessary";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
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
    window.localStorage.setItem(STORAGE_KEY, consent);
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
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-[var(--color-paper-dim)] transition hover:border-white/30 hover:text-[var(--color-paper)]"
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
