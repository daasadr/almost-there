import { describe, expect, it } from "vitest";
import { isReplanning } from "./replan-lock";

/**
 * Zámek na dobu přeplánování.
 *
 * Vzniklo z chyby, kterou bylo z rozhraní vidět úplně jinak, než kde
 * byla: uživatelka spustila přepočet, během něj odškrtala, co měla
 * hotové, a aplikace jí pak tvrdila, že se poslední tři dny nedodělaly.
 * Tempo se totiž čte na začátku přepočtu a plán se přepisuje na konci,
 * o několik minut později.
 *
 * Testuje se rozhodnutí „smí se teď sahat na plnění?“ — na něm stojí
 * odmítnutí v obou API pro úkoly.
 */

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000);

describe("isReplanning", () => {
  it("cíl bez zámku je volný", () => {
    expect(isReplanning(null)).toBe(false);
  });

  it("čerstvý zámek drží", () => {
    expect(isReplanning(minutesAgo(1))).toBe(true);
    expect(isReplanning(new Date())).toBe(true);
  });

  it("těsně před vypršením pořád drží", () => {
    // Přeplánování smí trvat pět minut, hranice je na deseti — devět
    // minut je pořád živý běh, ne pozůstatek.
    expect(isReplanning(minutesAgo(9))).toBe(true);
  });

  it("opuštěný zámek se nepočítá", () => {
    // Kdyby proces spadl mezi zamčením a odemčením, zůstal by cíl
    // zamčený navždy a uživatel by si už nikdy nic neodškrtl.
    expect(isReplanning(minutesAgo(11))).toBe(false);
    expect(isReplanning(minutesAgo(60 * 24))).toBe(false);
  });
});
