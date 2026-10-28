import { describe, expect, it } from "vitest";
import { pathFromReferer, trimUserAgent } from "./submit";
import { MAX_LENGTH, MIN_LENGTH } from "./limits";

/**
 * Kontext hlášení.
 *
 * Tohle je to jediné, podle čeho se dá „nefunguje mi to" dohledat, takže
 * na tom, co se uloží, záleží víc než na textu samotném. A protože se to
 * bere z hlavičky, kterou posílá prohlížeč, musí to snést i nesmysl.
 */
describe("pathFromReferer", () => {
  it("vezme z adresy jen cestu", () => {
    expect(pathFromReferer("https://almost-there.eu/cs/app/goals")).toBe(
      "/cs/app/goals",
    );
  });

  /*
   * Parametry se zahazují schválně: doména je vždycky naše, ale
   * v dotazu se můžou vézt jednorázové kódy z aktivace Vision Boardu.
   * Do výpisu ve správě nemají co dělat.
   */
  it("zahodí dotaz i kotvu", () => {
    expect(
      pathFromReferer("https://almost-there.eu/cs/visionboard/activate?code=TAJNE#x"),
    ).toBe("/cs/visionboard/activate");
  });

  it("chybějící hlavička nevadí", () => {
    expect(pathFromReferer(null)).toBeNull();
  });

  it("nesmysl místo adresy nevadí", () => {
    expect(pathFromReferer("tohle není adresa")).toBeNull();
    expect(pathFromReferer("")).toBeNull();
  });
});

describe("trimUserAgent", () => {
  it("zkrátí dlouhý řetězec", () => {
    expect(trimUserAgent("x".repeat(500))).toHaveLength(200);
  });

  it("krátký nechá být", () => {
    expect(trimUserAgent("Mozilla/5.0")).toBe("Mozilla/5.0");
  });

  it("prázdný a chybějící se neukládají", () => {
    expect(trimUserAgent("   ")).toBeNull();
    expect(trimUserAgent(null)).toBeNull();
  });
});

describe("meze hlášení", () => {
  /*
   * Formulář i server si je berou z téhož souboru. Kdyby si je opsaly,
   * rozejdou se a uživatel dostane od serveru odmítnutí, které mu
   * formulář slíbil přijmout.
   */
  it("dávají smysl", () => {
    expect(MIN_LENGTH).toBeGreaterThan(0);
    expect(MAX_LENGTH).toBeGreaterThan(MIN_LENGTH);
  });
});
