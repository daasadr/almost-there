import { describe, expect, it } from "vitest";
import {
  CURRENCY,
  MAX_WEEKS,
  MIN_WEEKS,
  priceBands,
  priceFor,
  toCrowns,
  weeksAllowed,
  WeeksOutOfRangeError,
} from "./pricing";

/**
 * Ceník.
 *
 * Nejde o složitý výpočet, jde o to, že se to počítá na serveru a že
 * chyba se tu pozná až na výpisu z účtu — buď zákazníkova, nebo našeho.
 * Hranice pásem se proto zkouší z obou stran.
 */
describe("priceFor", () => {
  it.each([
    [2, 9_900],
    [4, 9_900],
    [5, 14_900],
    [8, 14_900],
    [9, 19_900],
    [12, 19_900],
  ])("%i týdnů stojí %i haléřů", (weeks, expected) => {
    expect(priceFor(weeks)).toBe(expected);
  });

  /*
   * Mimo rozsah se vyhazuje chyba, ne nula ani nejbližší pásmo. Plán
   * zadarmo i plán za jinou cenu, než jakou člověk viděl, jsou chyby,
   * které se objeví až na výpisu z účtu.
   */
  it.each([1, 0, -3, 13, 52])("%i týdnů neprojde", (weeks) => {
    expect(() => priceFor(weeks)).toThrow(WeeksOutOfRangeError);
  });

  it("desetinný počet týdnů neprojde", () => {
    expect(() => priceFor(4.5)).toThrow(WeeksOutOfRangeError);
    expect(() => priceFor(Number.NaN)).toThrow(WeeksOutOfRangeError);
  });
});

describe("weeksAllowed", () => {
  it("souhlasí s priceFor na celém rozsahu", () => {
    for (let weeks = -2; weeks <= MAX_WEEKS + 3; weeks++) {
      const allowed = weeksAllowed(weeks);
      let priced = true;
      try {
        priceFor(weeks);
      } catch {
        priced = false;
      }
      expect(allowed, `${weeks} týdnů`).toBe(priced);
    }
  });
});

describe("priceBands", () => {
  const bands = priceBands();

  it("začíná na nejkratším a končí na nejdelším plánu", () => {
    expect(bands[0].fromWeeks).toBe(MIN_WEEKS);
    expect(bands.at(-1)?.toWeeks).toBe(MAX_WEEKS);
  });

  it("pásma na sebe navazují bez děr a bez překryvů", () => {
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i].fromWeeks).toBe(bands[i - 1].toWeeks + 1);
    }
  });

  it("ceny v pásmech sedí s priceFor", () => {
    for (const band of bands) {
      expect(priceFor(band.fromWeeks)).toBe(band.amountMinor);
      expect(priceFor(band.toWeeks)).toBe(band.amountMinor);
    }
  });
});

describe("zobrazení", () => {
  it("haléře na koruny", () => {
    expect(toCrowns(9_900)).toBe(99);
    expect(toCrowns(19_900)).toBe(199);
  });

  it("měna je malými písmeny, jak ji chce Stripe", () => {
    expect(CURRENCY).toBe(CURRENCY.toLowerCase());
  });
});
