import { describe, expect, it } from "vitest";
import {
  formatPrice,
  MAX_WEEKS,
  MIN_WEEKS,
  priceBands,
  priceFor,
  weeksAllowed,
  WeeksOutOfRangeError,
} from "./pricing";
import type { Locale } from "@/i18n/routing";

/**
 * Ceník.
 *
 * Nejde o složitý výpočet, jde o to, že se počítá na serveru a že
 * chyba se pozná až na výpisu z účtu — buď zákazníkova, nebo našeho.
 * Hranice pásem se proto zkouší z obou stran a ve všech jazycích.
 */
const LOCALES: Locale[] = ["cs", "en", "de"];

describe("priceFor", () => {
  it.each([
    [2, 9_900],
    [4, 9_900],
    [5, 14_900],
    [8, 14_900],
    [9, 19_900],
    [12, 19_900],
  ])("česky stojí %i týdnů %i haléřů", (weeks, expected) => {
    expect(priceFor(weeks, "cs").amountMinor).toBe(expected);
  });

  it("každý jazyk má svou měnu", () => {
    expect(priceFor(4, "cs").currency).toBe("czk");
    expect(priceFor(4, "en").currency).toBe("usd");
    expect(priceFor(4, "de").currency).toBe("eur");
  });

  /*
   * Měna se posílá pokladně s sebou. Kdyby se neposlala, vybral by si
   * ji Stripe podle karty a u pokladny by stála jiná částka než na
   * stránce — proto musí být ve všech pásmech jednoho jazyka stejná.
   */
  it.each(LOCALES)("%s má jednu měnu napříč pásmy", (locale) => {
    const currencies = priceBands(locale).map((b) => b.price.currency);
    expect(new Set(currencies).size).toBe(1);
  });

  it.each(LOCALES)("%s má ceny rostoucí s délkou", (locale) => {
    const amounts = priceBands(locale).map((b) => b.price.amountMinor);
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeGreaterThan(amounts[i - 1]);
    }
  });

  /*
   * Mimo rozsah se vyhazuje chyba, ne nula ani nejbližší pásmo. Plán
   * zadarmo i plán za jinou cenu, než jakou člověk viděl, jsou chyby,
   * které se objeví až na výpisu z účtu.
   */
  it.each([1, 0, -3, 13, 52])("%i týdnů neprojde", (weeks) => {
    expect(() => priceFor(weeks, "cs")).toThrow(WeeksOutOfRangeError);
  });

  it("desetinný počet týdnů neprojde", () => {
    expect(() => priceFor(4.5, "cs")).toThrow(WeeksOutOfRangeError);
    expect(() => priceFor(Number.NaN, "cs")).toThrow(WeeksOutOfRangeError);
  });
});

describe("weeksAllowed", () => {
  it("souhlasí s priceFor na celém rozsahu", () => {
    for (let weeks = -2; weeks <= MAX_WEEKS.daily + 3; weeks++) {
      let priced = true;
      try {
        priceFor(weeks, "cs");
      } catch {
        priced = false;
      }
      expect(weeksAllowed(weeks), `${weeks} týdnů`).toBe(priced);
    }
  });
});

describe("priceBands", () => {
  it.each(LOCALES)("%s: pásma pokrývají celý rozsah bez děr", (locale) => {
    const bands = priceBands(locale);
    expect(bands[0].fromWeeks).toBe(MIN_WEEKS);
    expect(bands.at(-1)?.toWeeks).toBe(MAX_WEEKS.daily);

    for (let i = 1; i < bands.length; i++) {
      expect(bands[i].fromWeeks).toBe(bands[i - 1].toWeeks + 1);
    }
  });

  it.each(LOCALES)("%s: ceny v pásmech sedí s priceFor", (locale) => {
    for (const band of priceBands(locale)) {
      expect(priceFor(band.fromWeeks, locale)).toEqual(band.price);
      expect(priceFor(band.toWeeks, locale)).toEqual(band.price);
    }
  });
});

describe("formatPrice", () => {
  it("koruny jsou celé, dolary a eura s haléři", () => {
    expect(formatPrice(priceFor(4, "cs"), "cs")).toContain("99");
    expect(formatPrice(priceFor(4, "cs"), "cs")).not.toContain(",00");
    expect(formatPrice(priceFor(4, "en"), "en")).toContain("4.99");
    expect(formatPrice(priceFor(4, "de"), "de")).toContain("4,49");
  });

  it.each(LOCALES)("%s: ve výsledku je značka měny", (locale) => {
    const text = formatPrice(priceFor(4, locale), locale);
    expect(text).toMatch(/[^\d\s.,]/);
  });
});

/**
 * Týdenní plány.
 *
 * Omezená není délka, ale podrobnost: „do konce března zaplatit zálohu
 * fotografovi" je za rok stejně pravdivé jako dnes, kdežto rozpis toho,
 * co se bude dělat devadesátý den, je výmysl. Ceny jsou stejné, dělí se
 * jen jinak — rozhoduje počet oddílů k odškrtání, a ten vyjde podobně.
 */
describe("týdenní podrobnost", () => {
  it("roční plán projde, u denního ne", () => {
    expect(weeksAllowed(52, "weekly")).toBe(true);
    expect(weeksAllowed(52, "daily")).toBe(false);
    expect(weeksAllowed(53, "weekly")).toBe(false);
  });

  it.each([
    [2, 9_900],
    [13, 9_900],
    [14, 14_900],
    [26, 14_900],
    [27, 19_900],
    [52, 19_900],
  ])("týdenní plán na %i týdnů stojí %i haléřů", (weeks, expected) => {
    expect(priceFor(weeks, "cs", "weekly").amountMinor).toBe(expected);
  });

  it("ceny jsou v obou podrobnostech tytéž, jen jinak rozdělené", () => {
    const daily = priceBands("cs", "daily").map((b) => b.price.amountMinor);
    const weekly = priceBands("cs", "weekly").map((b) => b.price.amountMinor);
    expect(weekly).toEqual(daily);
  });

  it("pásma navazují i u týdenní podrobnosti", () => {
    const bands = priceBands("cs", "weekly");
    expect(bands[0].fromWeeks).toBe(MIN_WEEKS);
    expect(bands.at(-1)?.toWeeks).toBe(MAX_WEEKS.weekly);
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i].fromWeeks).toBe(bands[i - 1].toWeeks + 1);
    }
  });
});
