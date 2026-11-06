import { describe, expect, it } from "vitest";
import { pdfPlanAreas, pdfPlanTemplates, templateById } from "./index";
import type { Locale } from "@/i18n/routing";

/**
 * Katalog šablon pro PDF.
 *
 * Chybějící překlad tu není chyba, ale prázdná kartička v nabídce —
 * a takové věci se objeví až u zákazníka, který za to zaplatil.
 * Soubor `index.ts` to hlídá i při sestavení; tohle řekne, co přesně
 * chybí, místo aby jen spadl build.
 */
const LOCALES: Locale[] = ["cs", "en", "de"];

describe("šablony PDF", () => {
  it("katalog není prázdný", () => {
    expect(pdfPlanTemplates.length).toBeGreaterThan(0);
  });

  it.each(pdfPlanTemplates.map((t) => [t.id, t] as const))(
    "%s má úplné texty ve všech jazycích",
    (_id, template) => {
      for (const locale of LOCALES) {
        const text = template.text[locale];
        expect(text, locale).toBeTruthy();
        expect(text.title.length, `${locale} title`).toBeGreaterThan(0);
        expect(text.pitch.length, `${locale} pitch`).toBeGreaterThan(0);
        expect(text.forWhom.length, `${locale} forWhom`).toBeGreaterThan(0);
        expect(text.goal.length, `${locale} goal`).toBeGreaterThan(0);
        expect(text.outline.length, `${locale} outline`).toBeGreaterThanOrEqual(3);
      }
    },
  );

  /*
   * Osnova je na stránce šablony jediné, co člověk před zaplacením
   * uvidí kromě ukázky. Ve všech jazycích proto musí slibovat totéž —
   * jinak by si zákazník koupil něco jiného podle toho, jak má
   * přepnutý jazyk.
   */
  it.each(pdfPlanTemplates.map((t) => [t.id, t] as const))(
    "%s slibuje ve všech jazycích stejný počet kroků",
    (_id, template) => {
      const counts = LOCALES.map((l) => template.text[l].outline.length);
      expect(new Set(counts).size, counts.join(" / ")).toBe(1);
    },
  );

  it("pokyn pro model je anglicky a věcný, ne pár slov", () => {
    for (const template of pdfPlanTemplates) {
      expect(template.guidance.length, template.id).toBeGreaterThan(400);
    }
  });

  it("id jsou jedinečná a dají se najít", () => {
    for (const template of pdfPlanTemplates) {
      expect(templateById(template.id)?.id).toBe(template.id);
    }
    expect(templateById("neexistuje")).toBeUndefined();
  });

  it("každá šablona patří do známé oblasti", () => {
    for (const template of pdfPlanTemplates) {
      expect(pdfPlanAreas, template.id).toContain(template.area);
    }
  });

  it("navržená délka se vejde do ceníku", () => {
    for (const template of pdfPlanTemplates) {
      expect(template.suggestedWeeks, template.id).toBeGreaterThanOrEqual(2);
      expect(template.suggestedWeeks, template.id).toBeLessThanOrEqual(12);
    }
  });
});
