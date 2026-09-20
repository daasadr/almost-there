import { describe, expect, it } from "vitest";
import {
  addDays,
  daysInclusive,
  parseIsoDate,
  splitRange,
  toIsoDate,
} from "./calendar";

/**
 * Kalendář je základ, na kterém stojí celý rozpad plánu. Chyba tady se
 * projeví až o tři vrstvy výš a vypadá jako chyba modelu.
 */

describe("splitRange", () => {
  it("rozdělí měsíc na týdny od pondělí", () => {
    const ranges = splitRange(
      parseIsoDate("2026-09-01"),
      parseIsoDate("2026-09-30"),
      "WEEK",
    );

    expect(ranges.length).toBeGreaterThan(3);
    // První úsek končí nejbližší nedělí, ne po sedmi dnech.
    expect(toIsoDate(ranges[0].startDate)).toBe("2026-09-01");
    expect(toIsoDate(ranges[0].endDate)).toBe("2026-09-06");
    // Poslední nesmí přetéct za konec.
    expect(toIsoDate(ranges.at(-1)!.endDate)).toBe("2026-09-30");
  });

  it("úseky na sebe navazují bez děr a bez překryvů", () => {
    const ranges = splitRange(
      parseIsoDate("2026-01-15"),
      parseIsoDate("2026-06-10"),
      "MONTH",
    );

    for (let i = 1; i < ranges.length; i++) {
      const previousEnd = ranges[i - 1].endDate;
      const currentStart = ranges[i].startDate;
      expect(toIsoDate(currentStart)).toBe(toIsoDate(addDays(previousEnd, 1)));
    }
  });

  it("vrátí jeden úsek, když se začátek a konec rovnají", () => {
    const day = parseIsoDate("2026-03-05");
    expect(splitRange(day, day, "WEEK")).toHaveLength(1);
  });

  /**
   * Tohle je ta chyba, kvůli které padalo „doženu skluz“.
   *
   * Dohnat skluz znamená nechat termín být; u cíle s uplynulým termínem
   * tedy vyjde konec před začátkem. Prázdné pole je správná odpověď —
   * volající se podle něj pozná, že není co plánovat. Kdyby tu místo něj
   * vznikl jeden obrácený úsek, model by dostal nesmyslné zadání.
   */
  it("vrátí prázdno, když konec předchází začátku", () => {
    const ranges = splitRange(
      parseIsoDate("2026-09-20"),
      parseIsoDate("2026-09-01"),
      "MONTH",
    );
    expect(ranges).toEqual([]);
  });
});

describe("převod dat", () => {
  it("čtení a zápis data jsou navzájem opačné", () => {
    // 2028 je přestupný, 2026 ne — u cílů na několik let se přes takový
    // rok běžně přechází.
    for (const iso of ["2026-01-01", "2028-02-29", "2026-12-31"]) {
      expect(toIsoDate(parseIsoDate(iso))).toBe(iso);
    }
  });

  it("posun o dny zvládne přechod přes měsíc i rok", () => {
    expect(toIsoDate(addDays(parseIsoDate("2026-01-31"), 1))).toBe("2026-02-01");
    expect(toIsoDate(addDays(parseIsoDate("2026-12-31"), 1))).toBe("2027-01-01");
    expect(toIsoDate(addDays(parseIsoDate("2026-03-01"), -1))).toBe("2026-02-28");
  });

  it("počet dnů počítá oba konce", () => {
    expect(
      daysInclusive(parseIsoDate("2026-05-01"), parseIsoDate("2026-05-01")),
    ).toBe(1);
    expect(
      daysInclusive(parseIsoDate("2026-05-01"), parseIsoDate("2026-05-07")),
    ).toBe(7);
  });
});
