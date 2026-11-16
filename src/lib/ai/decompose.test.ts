import { describe, expect, it } from "vitest";
import {
  buildUserPrompt,
  pickPlanLevel,
  planUnit,
  type DecomposeInput,
  type ReplanContext,
} from "./decompose";
import { goalLines } from "./expand";
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

/**
 * Zadání pro model při přeplánování.
 *
 * Tyhle testy stojí nad konkrétním průšvihem: cíl v polovině cesty se
 * po přepočtu rozjel znovu od nuly — založit aplikaci, založit
 * repozitář. Model to neudělal svévolně, zadání mu to řeklo třikrát
 * (pokyn ze šablony psaný od začátku, výchozí bod bez data a nic o tom,
 * co je hotové). Testy hlídají, že se to do zadání nevrátí.
 *
 * Kontroluje se text zadání, ne odpověď modelu. Co model udělá, se
 * testem zaručit nedá — co se ho zeptáme, ano.
 */

const TODAY = "2026-11-16";
const TARGET = "2027-05-16";
const RANGES = splitRange(parseIsoDate(TODAY), parseIsoDate(TARGET), "MONTH");

const BASE: DecomposeInput = {
  goal: "Od vibecodingu ke skutečnému programování",
  targetDate: TARGET,
  locale: "cs",
  today: TODAY,
  guidance: "Something that runs, in the first few days. Version control from the first week.",
  startingPoint: "Aplikaci si nechám napsat asistentem, sám jsem nenapsal skoro nic.",
};

const REPLAN: ReplanContext = {
  startedOn: "2026-05-04",
  pastMilestones: ["Běžící stránka, kterou sis napsal sám"],
  achieved: ["Běžící stránka, kterou sis napsal sám"],
  recentlyDone: ["Napsat ověření vstupu bez pomoci asistenta"],
  upcomingMilestones: ["Přihlašování, které si napíšeš sám"],
  completionRate: 0.7,
  missedDays: 9,
  deadlineMoved: true,
  blockers: [],
};

function prompt(input: Partial<DecomposeInput> = {}): string {
  return buildUserPrompt({ ...BASE, ...input }, "month", RANGES, TODAY);
}

describe("zadání při přeplánování", () => {
  it("zakáže naplánovat znovu, co je hotové", () => {
    expect(prompt({ replan: REPLAN })).toContain(
      "do not plan anything they have already done",
    );
  });

  it("vypíše dosažené milníky i odškrtané úkoly", () => {
    const text = prompt({ replan: REPLAN });

    expect(text).toContain("Běžící stránka, kterou sis napsal sám");
    expect(text).toContain("Napsat ověření vstupu bez pomoci asistenta");
    expect(text).toContain("never plan them again");
  });

  it("neuvádí postup, který se nestal", () => {
    // Cíl bez jediného odškrtnutí. Prázdný seznam s nadpisem „tohle máš
    // hotové" by modelu tvrdil něco, co není — a u nového cíle po pauze
    // je to rozdíl mezi navázáním a výmyslem.
    const text = prompt({
      replan: { ...REPLAN, achieved: [], recentlyDone: [] },
    });

    expect(text).not.toContain("Milestones they have actually reached");
    expect(text).not.toContain("The most recent work they ticked off");
  });

  it("označí výchozí bod za minulost a doplní datum", () => {
    const text = prompt({ replan: REPLAN });

    expect(text).toContain("when they set this goal on 2026-05-04");
    expect(text).toContain("This is history");
  });

  it("zarámuje pokyn ze šablony jako cestu od začátku", () => {
    expect(prompt({ replan: REPLAN })).toContain(
      "describes such a goal from its very beginning",
    );
  });

  it("při prvním rozpadu nic z toho nepřidává", () => {
    // Pro člověka, který cíl zakládá, je výchozí bod dnešek a pokyn
    // platí celý. Rámování by tam bylo matoucí.
    const text = prompt();

    expect(text).toContain("Where they are starting from.");
    expect(text).not.toContain("This is history");
    expect(text).not.toContain("describes such a goal from its very beginning");
    expect(text).not.toContain("REPLAN");
  });
});

describe("zadání pro týdny a dny", () => {
  const goal = {
    title: "Od vibecodingu ke skutečnému programování",
    targetDate: TARGET,
    restatement: null,
    finalChallenge: null,
    locale: "cs" as const,
    dailyCapacityMinutes: 60,
    restFrequency: "one full rest day per week",
    reflectionMinutesPerDay: 0,
  };

  it("nese dosažené milníky", () => {
    const text = goalLines({
      ...goal,
      achieved: ["Běžící stránka, kterou sis napsal sám"],
    }).join(" ");

    expect(text).toContain("Already reached on this goal");
    expect(text).toContain("Běžící stránka, kterou sis napsal sám");
  });

  it("u cíle bez dosažených milníků mlčí", () => {
    expect(goalLines(goal).join(" ")).not.toContain("Already reached");
  });
});
