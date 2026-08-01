import { defineRouting } from "next-intl/routing";

/**
 * Jazyky aplikace.
 *
 * Výchozí je angličtina (viz zadání, bod 10). Přidání dalšího jazyka =
 * přidat kód sem + vytvořit `messages/<kod>.json`. Do kódu se nesahá.
 * Plánované rozšíření: "es", "it", "fr".
 */
export const locales = ["en", "cs", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Lidsky čitelné názvy pro přepínač jazyků. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  cs: "Čeština",
  de: "Deutsch",
};

/**
 * Název jazyka tak, jak ho předáváme do AI promptu — vygenerovaný plán
 * musí být ve zvoleném jazyce aplikace, ne natvrdo anglicky (zadání 10).
 */
export const localeAiNames: Record<Locale, string> = {
  en: "English",
  cs: "Czech (čeština)",
  de: "German (Deutsch)",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Prefix v URL i pro výchozí jazyk: /en, /cs, /de — jednoznačné pro SEO
  // i pro sdílení odkazů na konkrétní jazykovou verzi.
  localePrefix: "always",
});
