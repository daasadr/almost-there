import { describe, expect, it } from "vitest";
import { checkDraft, weeksBetween, type OrderDraft } from "./order";

/**
 * Zadání jednorázového plánu.
 *
 * Počet týdnů z něj určuje cenu, takže chyba v počítání je chyba
 * v účtování. A souhlas s okamžitým dodáním je tu jediná věc, bez
 * které by se dalo odstoupit od smlouvy i po stažení PDF.
 */

const DRAFT: OrderDraft = {
  title: "Připravit se na maturitu z matematiky",
  hoursPerWeek: 6,
  startIso: "2026-11-07",
  targetIso: "2027-01-09", // devět týdnů
  consent: true,
  granularity: "daily",
  restDays: [],
};

describe("weeksBetween", () => {
  it("celé týdny vyjdou přesně", () => {
    expect(weeksBetween("2026-11-07", "2026-11-14")).toBe(1);
    expect(weeksBetween("2026-11-07", "2026-12-26")).toBe(7);
  });

  /*
   * Nahoru schválně: deset a půl týdne je jedenáctitýdenní plán.
   * Při zaokrouhlení dolů by poslední dny v plánu chyběly.
   */
  it("neúplný týden se počítá jako celý", () => {
    expect(weeksBetween("2026-11-07", "2026-11-15")).toBe(2);
    expect(weeksBetween("2026-11-07", "2026-11-08")).toBe(1);
  });

  it("termín v minulosti ani dnešek nedají žádný týden", () => {
    expect(weeksBetween("2026-11-07", "2026-11-07")).toBe(0);
    expect(weeksBetween("2026-11-07", "2026-10-01")).toBe(0);
  });

  /*
   * Přechod na zimní čas: mezi těmi daty je jedna hodina navíc.
   * Kdyby se počítalo z časů a ne z kalendářních dat, vyšel by
   * o týden delší plán a o padesát korun vyšší cena.
   */
  it("změna času nepřidá týden", () => {
    expect(weeksBetween("2026-10-18", "2026-11-08")).toBe(3);
  });

  it("nesmysl místo data nespadne", () => {
    expect(weeksBetween("nic", "2026-11-08")).toBe(0);
  });
});

describe("checkDraft", () => {
  it("dobré zadání projde a vrátí počet týdnů", () => {
    expect(checkDraft(DRAFT)).toEqual({ ok: true, weeks: 9 });
  });

  it("bez souhlasu to neprojde", () => {
    expect(checkDraft({ ...DRAFT, consent: false })).toEqual({
      ok: false,
      error: "consentRequired",
    });
  });

  /*
   * Souhlas se kontroluje až nakonec. Dozvědět se „zaškrtni souhlas"
   * u zadání, které stejně neprojde, je k ničemu.
   */
  it("špatné zadání se ohlásí dřív než chybějící souhlas", () => {
    expect(
      checkDraft({ ...DRAFT, consent: false, title: "krátké" }),
    ).toEqual({ ok: false, error: "titleTooShort" });
  });

  it("příliš blízký termín neprojde", () => {
    expect(checkDraft({ ...DRAFT, targetIso: "2026-11-10" })).toEqual({
      ok: false,
      error: "dateTooSoon",
    });
  });

  it("příliš vzdálený termín neprojde", () => {
    expect(checkDraft({ ...DRAFT, targetIso: "2027-06-01" })).toEqual({
      ok: false,
      error: "dateTooFar",
    });
  });

  it.each([0, -1, 41, 7.5])("%s hodin týdně neprojde", (hours) => {
    expect(checkDraft({ ...DRAFT, hoursPerWeek: hours as number })).toEqual({
      ok: false,
      error: "hoursOutOfRange",
    });
  });

  it("dlouhý popis neprojde", () => {
    expect(
      checkDraft({ ...DRAFT, description: "a".repeat(1001) }),
    ).toEqual({ ok: false, error: "textTooLong" });
  });

  it("mezery kolem názvu se nepočítají", () => {
    expect(checkDraft({ ...DRAFT, title: `   ${"a".repeat(9)}   ` })).toEqual({
      ok: false,
      error: "titleTooShort",
    });
  });
});

describe("podrobnost a volné dny", () => {
  it("roční plán projde jen u týdenní podrobnosti", () => {
    const rocni = { ...DRAFT, targetIso: "2027-11-06" };
    expect(checkDraft(rocni)).toEqual({ ok: false, error: "dateTooFar" });
    expect(checkDraft({ ...rocni, granularity: "weekly" as const }).ok).toBe(true);
  });

  /*
   * Sedm volných dnů znamená plán bez jediného pracovního dne.
   * Zaškrtávátko to nedovolí, ale požadavek může přijít odkudkoliv.
   */
  it("všech sedm dnů volna neprojde", () => {
    expect(
      checkDraft({ ...DRAFT, restDays: [0, 1, 2, 3, 4, 5, 6] }),
    ).toEqual({ ok: false, error: "restDaysInvalid" });
  });

  it("opakovaný ani neplatný den neprojde", () => {
    expect(checkDraft({ ...DRAFT, restDays: [6, 6] }).ok).toBe(false);
    expect(checkDraft({ ...DRAFT, restDays: [7] }).ok).toBe(false);
    expect(checkDraft({ ...DRAFT, restDays: [-1] }).ok).toBe(false);
  });

  it("obvyklý víkend projde", () => {
    expect(checkDraft({ ...DRAFT, restDays: [6, 0] }).ok).toBe(true);
  });
});
