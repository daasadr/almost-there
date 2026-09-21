import { describe, expect, it } from "vitest";
import { stageOf } from "./queries";
import { parseIsoDate } from "@/lib/plan/calendar";

/**
 * Pozice v etapách plánu.
 *
 * Tady je potřetí táž chyba: ukazatel postupu počítal odškrtnuté úkoly
 * ku všem, jenže „všechny" znamená ty, co existují v databázi — a ty
 * vznikají jen pro období, které se už rozepsalo. Cíl rozepsaný měsíc
 * dopředu tak hlásil „31 z 31" a plný pruh v prvním týdnu.
 *
 * Etapy vzniknou všechny při založení cíle, takže z nich jde počítat
 * od prvního dne. Testy popisují, co se od toho čeká.
 */

const stage = (from: string, to: string) => ({
  startDate: parseIsoDate(from),
  endDate: parseIsoDate(to),
});

const year = [
  stage("2026-01-01", "2026-03-31"),
  stage("2026-04-01", "2026-06-30"),
  stage("2026-07-01", "2026-09-30"),
  stage("2026-10-01", "2026-12-31"),
];

describe("stageOf", () => {
  it("najde etapu, ve které dnešek leží", () => {
    expect(stageOf(year, parseIsoDate("2026-05-15"))).toBe(2);
    expect(stageOf(year, parseIsoDate("2026-09-21"))).toBe(3);
  });

  it("počítá od jedničky, ne od nuly", () => {
    expect(stageOf(year, parseIsoDate("2026-01-01"))).toBe(1);
  });

  it("hranice patří etapě, která končí", () => {
    expect(stageOf(year, parseIsoDate("2026-03-31"))).toBe(1);
    expect(stageOf(year, parseIsoDate("2026-04-01"))).toBe(2);
  });

  it("cíl, který teprve začne, je na nule", () => {
    expect(stageOf(year, parseIsoDate("2025-12-01"))).toBe(0);
  });

  it("po uplynutí poslední etapy zůstane na konci, nespadne na nulu", () => {
    // Cíl s uplynulým termínem se nesmí tvářit, že ještě nezačal.
    expect(stageOf(year, parseIsoDate("2027-06-01"))).toBe(4);
  });

  it("cíl bez etap je na nule", () => {
    // Nerozfázovaný cíl — v rozhraní se místo pruhu ukáže hláška.
    expect(stageOf([], parseIsoDate("2026-05-15"))).toBe(0);
  });

  it("nikdy neukáže plno hned na začátku", () => {
    // To je přesně ta chyba, kvůli které tenhle výpočet vznikl.
    const share = stageOf(year, parseIsoDate("2026-01-05")) / year.length;
    expect(share).toBeLessThan(0.5);
  });
});
