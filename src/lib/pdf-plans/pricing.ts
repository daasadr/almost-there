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

/** Nejkratší plán, který má smysl rozfázovat na týdny. */
export const MIN_WEEKS = 2;

/**
 * Nejdelší jednorázový plán.
 *
 * Nad dvanáct týdnů se nenabízí schválně. Tak dlouhá cesta se beze
 * změn neujde a statický snímek by po čase lhal — tam patří
 * předplatné, které plán přepočítá. Je to zároveň poctivý argument,
 * proč si ho pořídit.
 */
export const MAX_WEEKS = 12;

export type PdfCurrency = "czk" | "usd" | "eur";

type Band = {
  upToWeeks: number;
  /** V nejmenších jednotkách měny — haléřích, centech. */
  amountMinor: number;
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
export function priceFor(weeks: number, locale: Locale): Price {
  if (!weeksAllowed(weeks)) {
    throw new WeeksOutOfRangeError(`Nepodporovaný počet týdnů: ${weeks}`);
  }

  const table = BANDS[locale];
  const band = table.bands.find((b) => weeks <= b.upToWeeks);
  if (!band) throw new WeeksOutOfRangeError(`Nepodporovaný počet týdnů: ${weeks}`);

  return { amountMinor: band.amountMinor, currency: table.currency };
}

/** Je tenhle počet týdnů k mání? Pro formulář, který se nemá ptát. */
export function weeksAllowed(weeks: number): boolean {
  return Number.isInteger(weeks) && weeks >= MIN_WEEKS && weeks <= MAX_WEEKS;
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
): { fromWeeks: number; toWeeks: number; price: Price }[] {
  const table = BANDS[locale];
  let from = MIN_WEEKS;

  return table.bands.map((band) => {
    const entry = {
      fromWeeks: from,
      toWeeks: band.upToWeeks,
      price: { amountMinor: band.amountMinor, currency: table.currency },
    };
    from = band.upToWeeks + 1;
    return entry;
  });
}
