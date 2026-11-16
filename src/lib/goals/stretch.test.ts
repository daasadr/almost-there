import { describe, expect, it } from "vitest";
import { catchUpDates, stretchRanges } from "./stretch";
import { addDays, parseIsoDate, toIsoDate } from "@/lib/plan/calendar";

/**
 * Roztažení zbytku plánu.
 *
 * Chyba v těchhle výpočtech se pozná až za týdny: den, který nepatří
 * do žádného období, se neprojeví ničím — jen v něm jednoho rána nic
 * není a plán se zastaví. Proto se tu hlídá hlavně návaznost, ne
 * konkrétní data.
 */

const ANCHOR = parseIsoDate("2026-12-01");
const OLD_TARGET = parseIsoDate("2027-03-01");
const NEW_TARGET = parseIsoDate("2027-06-01");

/** Tři období po zhruba měsíci, navazující na sebe. */
const BLOCKS = [
  { startDate: parseIsoDate("2026-12-01"), endDate: parseIsoDate("2026-12-31") },
  { startDate: parseIsoDate("2027-01-01"), endDate: parseIsoDate("2027-01-31") },
  { startDate: parseIsoDate("2027-02-01"), endDate: parseIsoDate("2027-03-01") },
];

describe("stretchRanges", () => {
  it("nechá první období začít na kotvě", () => {
    const stretched = stretchRanges({
      blocks: BLOCKS,
      anchor: ANCHOR,
      oldTarget: OLD_TARGET,
      newTarget: NEW_TARGET,
    });

    expect(toIsoDate(stretched[0].startDate)).toBe("2026-12-01");
  });

  it("dotáhne poslední období přesně na nový termín", () => {
    const stretched = stretchRanges({
      blocks: BLOCKS,
      anchor: ANCHOR,
      oldTarget: OLD_TARGET,
      newTarget: NEW_TARGET,
    });

    expect(toIsoDate(stretched.at(-1)!.endDate)).toBe("2027-06-01");
  });

  it("nenechá mezi obdobími mezeru ani překryv", () => {
    // Tohle je ta vlastnost, na které všechno stojí. Zkouší se na
    // nerovnoměrných obdobích i na nepěkném poměru, protože právě tam
    // se zaokrouhlení pozná.
    const uneven = [
      { startDate: parseIsoDate("2026-12-01"), endDate: parseIsoDate("2026-12-07") },
      { startDate: parseIsoDate("2026-12-08"), endDate: parseIsoDate("2027-01-19") },
      { startDate: parseIsoDate("2027-01-20"), endDate: parseIsoDate("2027-02-02") },
      { startDate: parseIsoDate("2027-02-03"), endDate: parseIsoDate("2027-03-01") },
    ];

    const stretched = stretchRanges({
      blocks: uneven,
      anchor: ANCHOR,
      oldTarget: OLD_TARGET,
      newTarget: parseIsoDate("2027-05-11"),
    });

    for (const [index, range] of stretched.entries()) {
      expect(
        range.endDate.getTime(),
        `období ${index + 1} končí dřív, než začalo`,
      ).toBeGreaterThanOrEqual(range.startDate.getTime());

      const next = stretched[index + 1];
      if (!next) continue;

      expect(
        toIsoDate(addDays(range.endDate, 1)),
        `mezi obdobím ${index + 1} a ${index + 2} je díra nebo překryv`,
      ).toBe(toIsoDate(next.startDate));
    }
  });

  it("zachová pořadí a počet období", () => {
    const stretched = stretchRanges({
      blocks: BLOCKS,
      anchor: ANCHOR,
      oldTarget: OLD_TARGET,
      newTarget: NEW_TARGET,
    });

    expect(stretched).toHaveLength(BLOCKS.length);
    for (const [index, range] of stretched.entries()) {
      const previous = stretched[index - 1];
      if (!previous) continue;
      expect(range.startDate.getTime()).toBeGreaterThan(
        previous.startDate.getTime(),
      );
    }
  });

  it("dá každému období víc času, ne míň", () => {
    const stretched = stretchRanges({
      blocks: BLOCKS,
      anchor: ANCHOR,
      oldTarget: OLD_TARGET,
      newTarget: NEW_TARGET,
    });

    for (const [index, range] of stretched.entries()) {
      const before = BLOCKS[index];
      const lengthBefore = before.endDate.getTime() - before.startDate.getTime();
      const lengthAfter = range.endDate.getTime() - range.startDate.getTime();
      expect(lengthAfter).toBeGreaterThanOrEqual(lengthBefore);
    }
  });

  it("nechá plán být, když se termín nikam neposouvá", () => {
    // Zkrácení sem nepatří — a spadnout kvůli němu by bylo horší než
    // nechat plán tak, jak byl.
    expect(
      stretchRanges({
        blocks: BLOCKS,
        anchor: ANCHOR,
        oldTarget: OLD_TARGET,
        newTarget: parseIsoDate("2027-02-01"),
      }),
    ).toEqual(BLOCKS);
  });

  it("na prázdném zbytku plánu nedělá nic", () => {
    expect(
      stretchRanges({
        blocks: [],
        anchor: ANCHOR,
        oldTarget: OLD_TARGET,
        newTarget: NEW_TARGET,
      }),
    ).toEqual([]);
  });
});

describe("catchUpDates", () => {
  it("vrací propadlou práci po jednom na den", () => {
    const dates = catchUpDates({ count: 3, from: parseIsoDate("2026-12-01") });

    expect(dates.map(toIsoDate)).toEqual([
      "2026-12-01",
      "2026-12-02",
      "2026-12-03",
    ]);
  });

  it("přeskočí dny odpočinku", () => {
    // Odpočinek je v plánu položka, ne zbytek. Den, na kterém má stát
    // „dnes nic", není místo pro nedodělek z minula.
    const dates = catchUpDates({
      count: 3,
      from: parseIsoDate("2026-12-01"),
      restDates: new Set(["2026-12-02", "2026-12-03"]),
    });

    expect(dates.map(toIsoDate)).toEqual([
      "2026-12-01",
      "2026-12-04",
      "2026-12-05",
    ]);
  });

  it("na nulovém počtu nevrací nic", () => {
    expect(catchUpDates({ count: 0, from: parseIsoDate("2026-12-01") })).toEqual(
      [],
    );
  });
});
