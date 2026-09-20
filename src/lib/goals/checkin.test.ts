import { describe, expect, it } from "vitest";
import { mergeDayProgress } from "./checkin";
import { parseIsoDate } from "@/lib/plan/calendar";

/**
 * Tady bydlela chyba „23 z 23 dní celých".
 *
 * Souhrn dne se zapisuje až při odškrtnutí úkolu, takže den, kdy člověk
 * neudělal vůbec nic, žádný záznam nemá. Dokud se chybějící záznam bral
 * jako „na tenhle den nebyl plán", vypadl takový den z čitatele i ze
 * jmenovatele — a přehled strukturálně nedokázal ukázat neúspěch.
 *
 * Testy níž popisují, co se od slučování čeká. Kdyby se někdy vrátilo
 * chování, kdy se den bez souhrnu ztratí, spadnou.
 */

const day = (iso: string) => parseIsoDate(iso);

describe("mergeDayProgress", () => {
  it("den s úkoly, ale bez souhrnu, se nesmí ztratit", () => {
    const merged = mergeDayProgress(
      [],
      [
        {
          startDate: day("2026-09-10"),
          tasks: [{ status: "PENDING" }, { status: "PENDING" }],
        },
      ],
    );

    const entry = merged.get("2026-09-10");
    expect(entry).toEqual({ total: 2, done: 0 });
  });

  it("sečte úkoly ze všech cílů v jednom dni", () => {
    const merged = mergeDayProgress(
      [],
      [
        { startDate: day("2026-09-10"), tasks: [{ status: "DONE" }] },
        {
          startDate: day("2026-09-10"),
          tasks: [{ status: "DONE" }, { status: "PENDING" }],
        },
      ],
    );

    expect(merged.get("2026-09-10")).toEqual({ total: 3, done: 2 });
  });

  it("uložený souhrn má přednost před dopočtem z úkolů", () => {
    // Souhrn přežije i smazání cíle, proto se mu věří víc. Tady schválně
    // nesedí s úkoly, aby bylo poznat, který zdroj vyhrál.
    const merged = mergeDayProgress(
      [{ date: day("2026-09-10"), tasksTotal: 5, tasksCompleted: 4 }],
      [{ startDate: day("2026-09-10"), tasks: [{ status: "PENDING" }] }],
    );

    expect(merged.get("2026-09-10")).toEqual({ total: 5, done: 4 });
  });

  it("den, na který se plán nedostal, v mapě není", () => {
    // Prázdno je správná odpověď: volající ho pozná podle chybějícího
    // klíče a nepočítá ho jako neúspěch. Volno podle plánu vypadá stejně.
    const merged = mergeDayProgress([], []);
    expect(merged.has("2026-09-10")).toBe(false);
  });

  it("odložený úkol se počítá jako nesplněný", () => {
    // Vědomé odložení je pořád práce, která se neudělala — na termín
    // to má stejný dopad jako vynechání.
    const merged = mergeDayProgress(
      [],
      [
        {
          startDate: day("2026-09-10"),
          tasks: [{ status: "DONE" }, { status: "DEFERRED" }],
        },
      ],
    );

    expect(merged.get("2026-09-10")).toEqual({ total: 2, done: 1 });
  });
});
