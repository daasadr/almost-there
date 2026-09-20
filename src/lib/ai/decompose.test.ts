import { describe, expect, it } from "vitest";
import { pickPlanLevel, planUnit } from "./decompose";
import { addDays, parseIsoDate, splitRange } from "@/lib/plan/calendar";

/**
 * Volba nejvyšší úrovně rozpadu.
 *
 * Rozhoduje o ceně i o čitelnosti: desetiletý cíl rozdělený na měsíce
 * by měl 120 položek, které nikdo nepřečte a za které se zaplatí
 * pětinásobek. Tříletý cíl v týdnech je totéž ještě hůř.
 */

describe("pickPlanLevel", () => {
  it("krátký horizont rozdělí na týdny", () => {
    expect(pickPlanLevel(14)).toBe("week");
    expect(pickPlanLevel(70)).toBe("week");
  });

  it("střední horizont na měsíce", () => {
    expect(pickPlanLevel(71)).toBe("month");
    expect(pickPlanLevel(550)).toBe("month");
  });

  it("dlouhý horizont na roky", () => {
    expect(pickPlanLevel(551)).toBe("year");
    expect(pickPlanLevel(3650)).toBe("year");
  });

  it("žádný horizont nedá plán o jediném období", () => {
    /*
     * To je ta skutečná mez, na které záleží: plán s jedním obdobím
     * není plán, jen cíl přepsaný jinými slovy.
     *
     * Horní hranice je volnější, než tvrdí popis u funkce. Na rozhraní
     * měsíců a let vychází 550 dní na osmnáct měsíců, ne na patnáct —
     * je to čitelné, ale ta věta o „2 až 15 položkách" je zaokrouhlená.
     */
    const start = parseIsoDate("2026-09-21");

    for (const days of [14, 30, 70, 71, 200, 365, 550, 551, 1200, 3650]) {
      const level = pickPlanLevel(days);
      // Přes `splitRange`, ne dělením pevnou délkou: období se řežou
      // po hranicích kalendáře, takže počet nevychází z průměru.
      const ranges = splitRange(start, addDays(start, days), planUnit(level));

      expect(ranges.length, `${days} dní → ${level}`).toBeGreaterThanOrEqual(2);
      expect(ranges.length, `${days} dní → ${level}`).toBeLessThanOrEqual(20);
    }
  });
});

describe("planUnit", () => {
  it("převede úroveň na jednotku kalendáře", () => {
    expect(planUnit("week")).toBe("WEEK");
    expect(planUnit("month")).toBe("MONTH");
    expect(planUnit("year")).toBe("YEAR");
  });
});
