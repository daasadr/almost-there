import type { Locale } from "@/i18n/routing";

/**
 * Tarify a jejich ceny.
 *
 * Cena je tu na jednom místě, ne roztroušená po komponentách — až se změní
 * (a podle zadání se změnit může), upravuje se jen tenhle soubor
 * a odpovídající ID ve Stripu.
 *
 * Zobrazovaná cena se musí shodovat s tou, kterou zákazník uvidí u pokladny.
 * Není to kosmetika, ale požadavek na transparentnost ceny.
 */

export const billingPeriods = ["monthly", "yearly"] as const;
export type BillingPeriod = (typeof billingPeriods)[number];

/** Kolik měsíců zdarma dává roční varianta oproti dvanácti měsíčním platbám. */
export const YEARLY_MONTHS_FREE = 2;

type PriceDisplay = {
  /** Částka tak, jak se ukazuje uživateli. */
  amount: string;
  /** Měna pro čtečky obrazovky a strukturovaná data. */
  currency: string;
};

/**
 * Ceny podle jazyka aplikace.
 *
 * Zatím všude koruna. Až se stanoví eurová cena, doplní se sem pro `en`
 * a `de` — a zároveň se musí založit odpovídající cena ve Stripu, jinak
 * by se zobrazovaná částka rozešla s účtovanou.
 */
const PRICES: Record<Locale, Record<BillingPeriod, PriceDisplay>> = {
  cs: {
    monthly: { amount: "179 Kč", currency: "CZK" },
    yearly: { amount: "1 790 Kč", currency: "CZK" },
  },
  en: {
    monthly: { amount: "179 CZK", currency: "CZK" },
    yearly: { amount: "1790 CZK", currency: "CZK" },
  },
  de: {
    monthly: { amount: "179 CZK", currency: "CZK" },
    yearly: { amount: "1790 CZK", currency: "CZK" },
  },
};

export function priceFor(
  locale: Locale,
  period: BillingPeriod,
): PriceDisplay {
  return PRICES[locale][period];
}

/**
 * ID cen ve Stripu. Drží se v prostředí, ne v kódu — testovací a ostrý
 * režim mají jiná, a commitovat je do repozitáře by znamenalo měnit kód
 * při každé úpravě ceníku.
 */
export function stripePriceId(period: BillingPeriod): string {
  const id =
    period === "monthly"
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_YEARLY;

  if (!id) {
    throw new Error(
      `Chybí ID ceny pro tarif "${period}". Doplň STRIPE_PRICE_MONTHLY a STRIPE_PRICE_YEARLY.`,
    );
  }
  return id;
}

export function isBillingPeriod(value: unknown): value is BillingPeriod {
  return (
    typeof value === "string" &&
    (billingPeriods as readonly string[]).includes(value)
  );
}
