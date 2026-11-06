/**
 * Cena jednorázového plánu podle počtu týdnů.
 *
 * Podle týdnů proto, že s nimi roste obojí — délka dokumentu
 * i náklad na model, který ho píše.
 *
 * Čistá funkce bez závislostí: počítá se na serveru při zakládání
 * platby a nikdy se nebere z těla požadavku. Kdyby cenu posílal
 * prohlížeč, dala by se přepsat na korunu.
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

/** Ceny v haléřích, ať se nikde nepočítá s desetinnými čísly. */
const BANDS: { upToWeeks: number; amountMinor: number }[] = [
  { upToWeeks: 4, amountMinor: 9_900 },
  { upToWeeks: 8, amountMinor: 14_900 },
  { upToWeeks: 12, amountMinor: 19_900 },
];

export const CURRENCY = "czk";

export class WeeksOutOfRangeError extends Error {
  readonly name = "WeeksOutOfRangeError";
}

/**
 * Kolik stojí plán na daný počet týdnů, v haléřích.
 *
 * Mimo rozsah vyhodí chybu, místo aby vrátila nulu nebo nejbližší
 * pásmo. Plán zadarmo nebo plán za jinou cenu, než jaká je vidět,
 * jsou dvě chyby, které by se zjistily až na výpisu z účtu.
 */
export function priceFor(weeks: number): number {
  if (!Number.isInteger(weeks) || weeks < MIN_WEEKS || weeks > MAX_WEEKS) {
    throw new WeeksOutOfRangeError(`Nepodporovaný počet týdnů: ${weeks}`);
  }

  const band = BANDS.find((b) => weeks <= b.upToWeeks);
  if (!band) throw new WeeksOutOfRangeError(`Nepodporovaný počet týdnů: ${weeks}`);

  return band.amountMinor;
}

/** Je tenhle počet týdnů k mání? Pro formulář, který se nemá ptát. */
export function weeksAllowed(weeks: number): boolean {
  return Number.isInteger(weeks) && weeks >= MIN_WEEKS && weeks <= MAX_WEEKS;
}

/** Cena v korunách k zobrazení. Ceny jsou vždy celé koruny. */
export function toCrowns(amountMinor: number): number {
  return Math.round(amountMinor / 100);
}

/** Pásma pro ceník na stránce: od kolika do kolika týdnů a za kolik. */
export function priceBands(): { fromWeeks: number; toWeeks: number; amountMinor: number }[] {
  let from = MIN_WEEKS;

  return BANDS.map((band) => {
    const entry = { fromWeeks: from, toWeeks: band.upToWeeks, amountMinor: band.amountMinor };
    from = band.upToWeeks + 1;
    return entry;
  });
}
