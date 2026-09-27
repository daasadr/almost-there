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
  /**
   * Táž částka jako číslo — pro strukturovaná data, ze kterých čtou
   * vyhledávače a jazykové modely. Z „1 790 Kč" si stroj cenu spolehlivě
   * nepřečte: je v tom mezera i měna a v jiném jazyce by to bylo jinak.
   */
  value: number;
  /**
   * Přibližná částka v měně, které čtenář rozumí. Jen pro orientaci.
   *
   * Účtuje se v korunách a tak to zůstane, dokud nebude eurová cena ve
   * Stripu. Cizinci ale „179 CZK" nic neříká — je to číslo bez měřítka
   * a část lidí kvůli tomu odejde dřív, než zjistí, že je to pár eur.
   * Tohle je ta informace, ne slib ceny: převod nakonec udělá banka
   * kupujícího svým kurzem.
   */
  approx?: string;
};

/**
 * Kurzy pro orientační přepočet.
 *
 * Odhad k **září 2026**, schválně hrubý. Zobrazuje se zaokrouhlené na
 * celé jednotky se značkou „přibližně", takže běžný pohyb kurzu na
 * výsledku nic nemění. Projít je stojí za to jednou za rok — a hlavně
 * ve chvíli, kdy vznikne opravdová eurová cena ve Stripu, protože pak
 * tenhle odhad zmizí úplně.
 */
const PER_EUR = 25;
const PER_USD = 23;

const eur = (czk: number) => Math.round(czk / PER_EUR);
const usd = (czk: number) => Math.round(czk / PER_USD);

/**
 * Ceny podle jazyka aplikace.
 *
 * Účtuje se všude v korunách. Cizojazyčné varianty k tomu přidávají
 * přibližný přepočet, aby „179 CZK" nebylo číslo bez měřítka — viz
 * `approx`. Je to orientace, ne druhá cena.
 *
 * Skutečná eurová cena by znamenala vlastní cenu ve Stripu; teprve pak
 * by se účtovalo v eurech a `approx` by zmizelo. Do té doby se musí
 * zobrazovaná částka v korunách shodovat s tou u pokladny.
 */
const PRICES: Record<Locale, Record<BillingPeriod, PriceDisplay>> = {
  cs: {
    monthly: { amount: "179 Kč", currency: "CZK", value: 179 },
    yearly: { amount: "1 790 Kč", currency: "CZK", value: 1790 },
  },
  en: {
    monthly: {
      amount: "179 CZK",
      currency: "CZK",
      value: 179,
      approx: `about €${eur(179)} / $${usd(179)}`,
    },
    yearly: {
      amount: "1790 CZK",
      currency: "CZK",
      value: 1790,
      approx: `about €${eur(1790)} / $${usd(1790)}`,
    },
  },
  de: {
    monthly: {
      amount: "179 CZK",
      currency: "CZK",
      value: 179,
      approx: `etwa ${eur(179)} €`,
    },
    yearly: {
      amount: "1790 CZK",
      currency: "CZK",
      value: 1790,
      approx: `etwa ${eur(1790)} €`,
    },
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
