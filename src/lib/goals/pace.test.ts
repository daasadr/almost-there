import { describe, expect, it } from "vitest";
import { estimateNewTarget, hasRecovered } from "./pace";
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

/**
 * Poznání, že je skluz za námi.
 *
 * Vzniklo z ostrých dat. Uživatelka měla za čtrnáct dní šest vynechaných
 * dnů, jenže všechny starší než týden — a posledních osm dnů hotových do
 * jednoho úkolu. Aplikace jí přesto nabízela posunutí termínu s větou
 * „poslední dny se nedotáhly“. Počítadlo totiž vědělo *kolik* dnů se
 * vynechalo, ale ne *kdy*.
 *
 * Data z toho účtu (dnes je 2026-09-22):
 *
 *   09-08 … 09-13   nedotažené
 *   09-14 … 09-21   všechno hotové
 */

const days = (from: string, to: string) => {
  const out: string[] = [];
  for (
    let d = parseIsoDate(from);
    d <= parseIsoDate(to);
    d = new Date(d.getTime() + 86_400_000)
  ) {
    out.push(toIsoDate(d));
  }
  return out;
};

describe("hasRecovered", () => {
  const today = parseIsoDate("2026-09-22");
  const planned = days("2026-09-08", "2026-09-21");

  it("pozná návrat do tempa z ostrých dat", () => {
    const missed = days("2026-09-08", "2026-09-13");
    expect(hasRecovered(missed, planned, today)).toBe(true);
  });

  it("čerstvý skluz za návrat nepovažuje", () => {
    // Včerejšek nedotažený — nabídka se ukázat má.
    const missed = days("2026-09-19", "2026-09-21");
    expect(hasRecovered(missed, planned, today)).toBe(false);
  });

  it("jediný vynechaný den v rozhodném úseku stačí", () => {
    expect(hasRecovered(["2026-09-19"], planned, today)).toBe(false);
  });

  it("den těsně za hranicí už nevadí", () => {
    // Rozhoduje pět dnů zpátky, tedy 09-17 až 09-21.
    expect(hasRecovered(["2026-09-17"], planned, today)).toBe(false);
    expect(hasRecovered(["2026-09-16"], planned, today)).toBe(true);
  });

  it("úplné ticho není návrat do tempa", () => {
    // Kdo aplikaci vůbec neotevřel, nemá naplánované dny — a „žádný
    // vynechaný den“ by mu jinak prošlo jako bezchybný týden.
    expect(hasRecovered([], [], today)).toBe(false);
  });

  it("bez jediného vynechaného dne je to návrat", () => {
    expect(hasRecovered([], planned, today)).toBe(true);
  });
});
