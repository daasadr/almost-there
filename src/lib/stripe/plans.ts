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

/**
 * Délka zkušebního období, ve dnech.
 *
 * Sedm dní stačí na to, aby si člověk osahal provoz: denní checklist,
 * odpočinkový den, týdenní ohlédnutí, ranní myšlenku. Co za tu dobu
 * neuvidí, je přizpůsobení plánu — nabídka přeplánování naskakuje až po
 * třech vynechaných dnech. To ale drží lidi, ne získává, takže texty
 * o zkoušce mají slibovat rytmus, ne chytrost.
 *
 * Delší zkouška by ukázala víc, jenže každý nekonvertovaný uživatel
 * stojí peníze za volání modelu — a ty se s délkou násobí.
 */
export const TRIAL_DAYS = 7;

/** Kolik dní před koncem zkoušky přijde připomínka. */
export const TRIAL_REMINDER_DAYS_BEFORE = 2;

type PriceDisplay = {
  /** Částka tak, jak se ukazuje uživateli. */
  amount: string;
  /**
   * Měna podle ISO 4217. Jde do strukturovaných dat a **zároveň se
   * posílá Stripu**, aby se u pokladny účtovalo v tom, co jsme ukázali.
   */
  currency: "CZK" | "EUR" | "USD";
  /**
   * Táž částka jako číslo — pro strukturovaná data, ze kterých čtou
   * vyhledávače a jazykové modely. Z „1 790 Kč" si stroj cenu spolehlivě
   * nepřečte: je v tom mezera i měna a v jiném jazyce by to bylo jinak.
   */
  value: number;
};

/**
 * Ceny podle jazyka aplikace.
 *
 * Dřív se všude účtovalo v korunách a cizinci se ukazoval orientační
 * přepočet. To odstranilo nečitelnost, ale ne to podstatné: platil
 * v cizí měně a jeho banka si k převodu přidala své rozpětí. Teď má
 * každá jazyková verze vlastní cenu ve své měně.
 *
 * ── Čísla nejsou přepočtem ──────────────────────────────────────────
 *
 * 6,99 € ani 7,99 $ nevyšlo z kurzu — je to samostatně stanovená cena,
 * která se blíží korunové a přitom vypadá jako cena, ne jako výsledek
 * dělení. Od té chvíle si žije vlastním životem: pohyb kurzu na ni
 * nemá vliv a měnit se má vědomě, ne automaticky.
 *
 * ── Musí sedět se Stripem ───────────────────────────────────────────
 *
 * U každé ceny ve Stripu musí být tahle měna zapnutá jako měnová
 * varianta a částka se musí shodovat do haléře. Pokladna dostane měnu
 * z tohohle souboru, takže rozejít se to nemůže tiše — Stripe rovnou
 * odmítne vytvořit relaci.
 *
 * ── Jazyk není země ─────────────────────────────────────────────────
 *
 * Angličtinu mluví i lidé v eurozóně a naopak. Řídit se jazykem je
 * odhad, ale odhad poctivý: co se ukáže, to se účtuje, protože měnu
 * posíláme pokladně s sebou.
 */
const PRICES: Record<Locale, Record<BillingPeriod, PriceDisplay>> = {
  cs: {
    monthly: { amount: "179 Kč", currency: "CZK", value: 179 },
    yearly: { amount: "1 790 Kč", currency: "CZK", value: 1790 },
  },
  en: {
    monthly: { amount: "$7.99", currency: "USD", value: 7.99 },
    yearly: { amount: "$79", currency: "USD", value: 79 },
  },
  de: {
    monthly: { amount: "6,99 €", currency: "EUR", value: 6.99 },
    yearly: { amount: "69 €", currency: "EUR", value: 69 },
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
