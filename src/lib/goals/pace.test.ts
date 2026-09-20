import { describe, expect, it } from "vitest";
import { estimateNewTarget } from "./pace";
import { parseIsoDate, toIsoDate } from "@/lib/plan/calendar";

/**
 * Výpočet nového termínu podle skutečného tempa.
 *
 * Je to jediné místo, kde aplikace sama navrhuje datum — když se splete,
 * slíbí uživateli něco, co nemůže vyjít.
 */

const day = (iso: string) => parseIsoDate(iso);

describe("estimateNewTarget", () => {
  it("při plném tempu termín jen zaokrouhlí na týdny, neprotahuje", () => {
    const today = day("2026-09-01");
    const target = day("2026-10-27"); // 56 dní = přesně 8 týdnů

    expect(toIsoDate(estimateNewTarget(today, target, 1))).toBe("2026-10-27");
  });

  it("poloviční tempo znamená zhruba dvojnásobek zbývajícího času", () => {
    const today = day("2026-09-01");
    const target = day("2026-10-27"); // 8 týdnů

    const result = estimateNewTarget(today, target, 0.5);
    const weeks = Math.round(
      (result.getTime() - today.getTime()) / (7 * 86_400_000),
    );

    expect(weeks).toBe(16);
  });

  it("nulové tempo nedá nekonečno, ale zastaví se na dolní mezi", () => {
    // Bez dolní meze by dělení nulou poslalo termín mimo kalendář.
    const today = day("2026-09-01");
    const target = day("2026-10-27");

    const result = estimateNewTarget(today, target, 0);
    const weeks = Math.round(
      (result.getTime() - today.getTime()) / (7 * 86_400_000),
    );

    // Dolní mez je čtvrtinová úspěšnost, tedy nejvýš čtyřnásobek.
    expect(weeks).toBe(32);
  });

  it("navržený termín leží vždy v budoucnu, i když ten původní uplynul", () => {
    const today = day("2026-09-01");
    const target = day("2026-06-01"); // tři měsíce zpátky

    const result = estimateNewTarget(today, target, 0.5);
    expect(result.getTime()).toBeGreaterThan(today.getTime());
  });

  it("výsledek padne vždy na celé týdny od dneška", () => {
    const today = day("2026-09-01");

    for (const rate of [0.3, 0.55, 0.8, 1]) {
      const result = estimateNewTarget(today, day("2027-03-15"), rate);
      const days = (result.getTime() - today.getTime()) / 86_400_000;
      expect(days % 7).toBe(0);
    }
  });
});
