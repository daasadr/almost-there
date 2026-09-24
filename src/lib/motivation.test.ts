import { describe, expect, it } from "vitest";
import {
  labelIndexForDay,
  pieceNumberForDay,
  splitSentences,
  teaser,
} from "./motivation";
import { parseIsoDate } from "@/lib/plan/calendar";

/**
 * Myšlenka na den.
 *
 * Dvě místa, kde se dá snadno udělat chyba, kterou nikdo nenahlásí:
 * výběr textu (uživateli prostě přijde jiný, než měl) a dělení na věty
 * (předčítání se zasekne uprostřed slova). Ani jedno se nepozná jinak
 * než tím, že si toho někdo všimne.
 */

describe("pieceNumberForDay", () => {
  const start = parseIsoDate("2026-03-10");

  it("první den dostane první text", () => {
    expect(pieceNumberForDay(start, parseIsoDate("2026-03-10"), 14)).toBe(1);
  });

  it("každý další den posune o jedna", () => {
    expect(pieceNumberForDay(start, parseIsoDate("2026-03-11"), 14)).toBe(2);
    expect(pieceNumberForDay(start, parseIsoDate("2026-03-23"), 14)).toBe(14);
  });

  it("po vyčerpání knihovny se začne znovu", () => {
    // Patnáctý den, knihovna má čtrnáct textů.
    expect(pieceNumberForDay(start, parseIsoDate("2026-03-24"), 14)).toBe(1);
  });

  it("dva lidé s různým začátkem dostanou týž den jiný text", () => {
    // Tohle je smysl celé té funkce: kdo přijde později, nezačíná
    // uprostřed řady.
    const later = parseIsoDate("2026-03-12");
    const day = parseIsoDate("2026-03-15");
    expect(pieceNumberForDay(start, day, 14)).toBe(6);
    expect(pieceNumberForDay(later, day, 14)).toBe(4);
  });

  it("čas registrace nerozhoduje, jen den", () => {
    const evening = new Date("2026-03-10T23:50:00Z");
    expect(pieceNumberForDay(evening, parseIsoDate("2026-03-11"), 14)).toBe(2);
  });

  it("prázdná knihovna vrátí nulu, ne pád", () => {
    expect(pieceNumberForDay(start, parseIsoDate("2026-03-15"), 0)).toBe(0);
  });

  it("datum začátku v budoucnosti spadne na první text", () => {
    expect(pieceNumberForDay(parseIsoDate("2026-05-01"), start, 14)).toBe(1);
  });
});

describe("labelIndexForDay", () => {
  it("střídá oslovení a nikdy nespadne mimo", () => {
    const seen = [0, 1, 2, 3, 4].map((d) => labelIndexForDay(d, 3));
    expect(seen).toEqual([0, 1, 2, 0, 1]);
  });

  it("dva dny po sobě nedostanou totéž", () => {
    for (let day = 0; day < 20; day++) {
      expect(labelIndexForDay(day, 4)).not.toBe(labelIndexForDay(day + 1, 4));
    }
  });

  it("bez oslovení vrátí nulu", () => {
    expect(labelIndexForDay(7, 0)).toBe(0);
  });
});

describe("splitSentences", () => {
  it("rozdělí běžný text", () => {
    expect(splitSentences("První věta. Druhá věta! Třetí?")).toEqual([
      "První věta.",
      "Druhá věta!",
      "Třetí?",
    ]);
  });

  it("řadová číslovka větu nekončí", () => {
    // Bez tohohle by se předčítání zastavilo uprostřed myšlenky.
    expect(splitSentences("Přijde to 14. dne. Pak už ne.")).toEqual([
      "Přijde to 14. dne.",
      "Pak už ne.",
    ]);
  });

  it("zkratka větu nekončí", () => {
    expect(splitSentences("Třeba např. takhle. A dost.")).toEqual([
      "Třeba např. takhle.",
      "A dost.",
    ]);
  });

  it("tři tečky drží pohromadě", () => {
    expect(splitSentences("Nevím… Uvidíme.")).toEqual(["Nevím…", "Uvidíme."]);
  });

  it("text bez tečky na konci se neztratí", () => {
    expect(splitSentences("Jedna věta. A druhá bez tečky")).toEqual([
      "Jedna věta.",
      "A druhá bez tečky",
    ]);
  });

  it("prázdný text nevrátí prázdnou větu", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   ")).toEqual([]);
  });

  it("nic z textu nezmizí", () => {
    // Předčítání musí říct všechno. Kdyby dělení kus spolklo, nikdo by
    // si toho nevšiml — jen by tam ta věta nebyla.
    const text =
      "Začátek nikdy nevypadá jako začátek. Většinou je to 15. minuta něčeho nepřehledného, např. hledání. A pak?";
    const joined = splitSentences(text).join(" ");
    expect(joined).toBe(text);
  });
});

describe("teaser", () => {
  it("vezme první větu", () => {
    expect(teaser(["První věta. Druhá věta.", "Další odstavec."])).toBe(
      "První věta.",
    );
  });

  it("odstavec o jedné větě vrátí celý", () => {
    expect(teaser(["Jenom tohle."])).toBe("Jenom tohle.");
  });

  it("přeskočí oslovení", () => {
    // Texty začínají pozdravem. Na zamčené obrazovce by jinak stálo jen
    // „Ahoj," a nikdo by se nedozvěděl, o čem to dnes je.
    expect(
      teaser([
        "Ahoj, ty na cestě za svými cíli,",
        "Napadlo tě někdy, jak ty nejjasnější nápady skoro nikdy nepřicházejí, když jedeš na sto procent? Čekají na něco měkčího.",
      ]),
    ).toBe(
      "Napadlo tě někdy, jak ty nejjasnější nápady skoro nikdy nepřicházejí, když jedeš na sto procent?",
    );
  });

  it("text ze samých krátkých odstavců nevrátí prázdno", () => {
    expect(teaser(["Ahoj.", "Měj se."])).toBe("Ahoj.");
  });

  it("prázdný text nespadne", () => {
    expect(teaser([])).toBe("");
  });
});
