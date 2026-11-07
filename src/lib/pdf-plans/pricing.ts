import type { Locale } from "@/i18n/routing";

/**
 * Cena jednorázového plánu podle počtu týdnů a jazyka.
 *
 * Podle týdnů proto, že s nimi roste obojí — délka dokumentu i náklad
 * na model, který ho píše.
 *
 * Podle jazyka ze stejného důvodu jako u předplatného: angličtinu
 * mluví i lidé v eurozóně a naopak, takže je to odhad — ale poctivý,
 * protože měnu posíláme pokladně s sebou a účtuje se to, co se
 * ukázalo. Kdyby se měna neposlala, vybral by si ji Stripe podle
 * karty a u pokladny by stála jiná částka než na stránce.
 *
 * Celé je to čisté počítání bez závislostí: cena vzniká na serveru
 * a nikdy se nebere z těla požadavku. Jinak by se dala přepsat.
 */

import type { Granularity } from "./plan";

/** Nejkratší plán, který má smysl rozfázovat. */
export const MIN_WEEKS = 2;

/**
 * Nejdelší plán, podle podrobnosti.
 *
 * Omezená není délka, ale podrobnost. Původně tu stál jeden strop
 * dvanácti týdnů s tím, že delší statický snímek začne lhát — a to
 * platí, jenže jen pro **denní** úkoly. Kdo si nechá rozepsat, co bude
 * dělat devadesátý den, dostane výmysl.
 *
 * U týdenního plánu to neplatí: „do konce března zaplatit zálohu
 * fotografovi" je za rok stejně pravdivé jako dnes, protože se neslibuje
 * den, ale pořadí a lhůty. Proto se roční svatba naplánovat dá a roční
 * příprava na maraton po dnech ne.
 */
export const MAX_WEEKS: Record<Granularity, number> = {
  daily: 12,
  weekly: 52,
};

export type PdfCurrency = "czk" | "usd" | "eur";

type Band = {
  upToWeeks: number;
  /** V nejmenších jednotkách měny — haléřích, centech. */
  amountMinor: number;
};

/**
 * Hranice pásem podle podrobnosti.
 *
 * Ceny jsou stejné, dělí se jen jinak. Rozhoduje, kolik je v dokumentu
 * oddílů k odškrtání — a dvanáctitýdenní denní plán jich má kolem
 * sedmdesáti, kdežto roční týdenní dvaapadesát. Je to tedy srovnatelná
 * práce za srovnatelné peníze, i když týdnů je čtyřikrát víc.
 */
const BOUNDS: Record<Granularity, [number, number, number]> = {
  daily: [4, 8, 12],
  weekly: [13, 26, 52],
};

/**
 * Ceny jsou v nejmenších jednotkách, ať se nikde nepočítá
 * s desetinnými čísly. Stripe je chce stejně takhle.
 */
const BANDS: Record<Locale, { currency: PdfCurrency; bands: Band[] }> = {
  cs: {
    currency: "czk",
    bands: [
      { upToWeeks: 4, amountMinor: 9_900 },
      { upToWeeks: 8, amountMinor: 14_900 },
      { upToWeeks: 12, amountMinor: 19_900 },
    ],
  },
  en: {
    currency: "usd",
    bands: [
      { upToWeeks: 4, amountMinor: 499 },
      { upToWeeks: 8, amountMinor: 699 },
      { upToWeeks: 12, amountMinor: 899 },
    ],
  },
  de: {
    currency: "eur",
    bands: [
      { upToWeeks: 4, amountMinor: 449 },
      { upToWeeks: 8, amountMinor: 649 },
      { upToWeeks: 12, amountMinor: 849 },
    ],
  },
};

export class WeeksOutOfRangeError extends Error {
  readonly name = "WeeksOutOfRangeError";
}

export type Price = {
  amountMinor: number;
  currency: PdfCurrency;
};

/**
 * Kolik stojí plán na daný počet týdnů.
 *
 * Mimo rozsah vyhodí chybu, místo aby vrátila nulu nebo nejbližší
 * pásmo. Plán zadarmo nebo plán za jinou cenu, než jaká je vidět,
 * jsou dvě chyby, které by se zjistily až na výpisu z účtu.
 */
export function priceFor(
  weeks: number,
  locale: Locale,
  granularity: Granularity = "daily",
): Price {
  if (!weeksAllowed(weeks, granularity)) {
    throw new WeeksOutOfRangeError(`Nepodporovaný počet týdnů: ${weeks}`);
  }

  const table = BANDS[locale];
  const bounds = BOUNDS[granularity];
  const index = bounds.findIndex((limit) => weeks <= limit);
  if (index < 0) throw new WeeksOutOfRangeError(`Nepodporovaný počet týdnů: ${weeks}`);

  return {
    amountMinor: table.bands[index].amountMinor,
    currency: table.currency,
  };
}

/** Je tenhle počet týdnů k mání? Pro formulář, který se nemá ptát. */
export function weeksAllowed(
  weeks: number,
  granularity: Granularity = "daily",
): boolean {
  return (
    Number.isInteger(weeks) &&
    weeks >= MIN_WEEKS &&
    weeks <= MAX_WEEKS[granularity]
  );
}

/**
 * Cena k zobrazení, se značkou měny podle zvyklostí jazyka.
 *
 * Skládá ji `Intl`, ne my: v češtině stojí značka za číslem
 * a s mezerou, v angličtině před ním.
 */
export function formatPrice(price: Price, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency.toUpperCase(),
    // Koruny jsou vždycky celé; u dolarů a eur haléře patří k ceně.
    maximumFractionDigits: price.currency === "czk" ? 0 : 2,
  }).format(price.amountMinor / 100);
}

/** Pásma pro ceník na stránce: od kolika do kolika týdnů a za kolik. */
export function priceBands(
  locale: Locale,
  granularity: Granularity = "daily",
): { fromWeeks: number; toWeeks: number; price: Price }[] {
  const table = BANDS[locale];
  const bounds = BOUNDS[granularity];
  let from = MIN_WEEKS;

  return bounds.map((upTo, i) => {
    const entry = {
      fromWeeks: from,
      toWeeks: upTo,
      price: {
        amountMinor: table.bands[i].amountMinor,
        currency: table.currency,
      },
    };
    from = upTo + 1;
    return entry;
  });
}
