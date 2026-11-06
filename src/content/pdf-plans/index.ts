import type { Locale } from "@/i18n/routing";
import { exams } from "./exams";
import { fitness } from "./fitness";

/**
 * Šablony jednorázových plánů v PDF.
 *
 * Vlastní katalog, oddělený od šablon cílů v aplikaci. Důvod je
 * praktický: tyhle se prodávají, takže je u nich jiné, co má být vidět
 * (ukázka, cena, délka) a jiné, co se neptáme — jednorázový plán
 * nemá dotazník, protože mezi zájmem a platbou nemá stát deset polí.
 *
 * `guidance` je pokyn pro model a uživatel ho nevidí. Anglicky a jednou
 * pro všechny jazyky, ze stejného důvodu jako u šablon cílů: ve třech
 * verzích by se laděním jedné zbylé dvě tiše rozešly.
 *
 * Tohle je to jediné, co odlišuje koupený plán od toho, co si člověk
 * vygoogluje zdarma. Čím konkrétnější, tím lépe.
 */

/** Oblasti v pořadí, ve kterém se zobrazují. */
export const pdfPlanAreas = ["exams", "fitness"] as const;

export type PdfPlanArea = (typeof pdfPlanAreas)[number];

/** Co uživatel u šablony uvidí. Jazyková verze. */
export type PdfPlanText = {
  title: string;
  /** Proč zrovna tahle. Jedna dvě věty. */
  pitch: string;
  /** Komu sedne. Ať se pozná ten, kdo váhá. */
  forWhom: string;
  /**
   * Čím plán prochází. Tři až pět kroků.
   *
   * Na stránce šablony je tohle spolu s ukázkovou stranou PDF to
   * jediné, podle čeho se člověk rozhoduje — platí se předem, takže
   * nic jiného před platbou neuvidí. Musí to tedy slibovat přesně to,
   * co `guidance` opravdu udělá.
   */
  outline: string[];
  /** Předvyplněné zadání. Uživatel ho upraví. */
  goal: string;
};

export type PdfPlanTemplate = {
  id: string;
  area: PdfPlanArea;
  /** Rozumná délka v týdnech. Uživatel zadává termín, tohle jen radí. */
  suggestedWeeks: number;
  /** Odborný pokyn pro model. Anglicky, jednou pro všechny jazyky. */
  guidance: string;
  text: Record<Locale, PdfPlanText>;
};

const ALL: PdfPlanTemplate[] = [...exams, ...fitness];

/**
 * Jazyky musí mít všechny šablony stejné. Chybějící překlad by nebyl
 * chyba, ale prázdná kartička — a takové věci se objeví až u uživatele.
 * Padne to při sestavení.
 */
function assertComplete(): void {
  const locales: Locale[] = ["cs", "en", "de"];
  for (const template of ALL) {
    for (const locale of locales) {
      const text = template.text[locale];
      if (!text?.title || !text.goal || text.outline.length === 0) {
        throw new Error(
          `Šablona PDF ${template.id} nemá úplný text pro jazyk ${locale}.`,
        );
      }
    }
  }

  const ids = ALL.map((t) => t.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Dvě šablony PDF mají stejné id.");
  }
}

assertComplete();

export const pdfPlanTemplates: readonly PdfPlanTemplate[] = ALL;

export function templateById(id: string): PdfPlanTemplate | undefined {
  return ALL.find((template) => template.id === id);
}
