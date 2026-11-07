import type { Locale } from "@/i18n/routing";
import { exams } from "./exams";
import { fitness } from "./fitness";
import { life } from "./life";

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
export const pdfPlanAreas = ["exams", "fitness", "life"] as const;

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
  /**
   * Co se škrtá, když se přestane stíhat.
   *
   * Má v PDF vlastní stranu. Každý plán se dřív nebo později rozejde
   * se skutečností a tohle je rozdíl mezi plánem, který to ustojí,
   * a seznamem předsevzetí — vytištěný papír se navíc sám
   * nepřepočítá, takže je to tam potřeba ještě víc než v aplikaci.
   *
   * Píše se ručně, ne modelem: je to to nejcennější na celém
   * dokumentu a nemá kolísat od objednávky k objednávce.
   */
  whenBehind: string;
  /** Předvyplněné zadání. Uživatel ho upraví. */
  goal: string;
};

export type PdfPlanTemplate = {
  id: string;
  area: PdfPlanArea;
  /**
   * Jak podrobný plán je.
   *
   * `daily` — období je týden, oddíl den. Pro cíle, u kterých se
   * cvičí nebo učí: tam má smysl říct, co se dělá v úterý.
   *
   * `weekly` — období je měsíc, oddíl týden. Pro zařizování: u svatby
   * nemá smysl plánovat „v úterý zavolej fotografovi", zavolá se, až
   * to půjde, a důležité je, že se to má stihnout tenhle týden. Rozpis
   * po dnech by tam jen předstíral přesnost, kterou nikdo nedodrží —
   * a první nedodržený den zpochybní celý plán.
   *
   * Volí to šablona, ne uživatel. Je to odborné rozhodnutí o tom, jak
   * se takový cíl dělá, stejně jako `guidance`.
   */
  granularity: "daily" | "weekly";
  /** Rozumná délka v týdnech. Uživatel zadává termín, tohle jen radí. */
  suggestedWeeks: number;
  /** Odborný pokyn pro model. Anglicky, jednou pro všechny jazyky. */
  guidance: string;
  /**
   * Upozornění na poslední straně, když obor zasahuje do zdraví
   * nebo peněz.
   *
   * Plán píše model, ne lékař ani poradce. U běhání, cvičení
   * a dluhů to musí být napsané — ne kvůli pojistce, ale protože
   * člověk, který si koupil tréninkový plán, má vědět, kdy má jít
   * za někým jiným.
   */
  disclaimer?: "health" | "finance";
  text: Record<Locale, PdfPlanText>;
};

const ALL: PdfPlanTemplate[] = [...exams, ...fitness, ...life];

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
      if (
        !text?.title ||
        !text.goal ||
        !text.whenBehind ||
        text.outline.length === 0
      ) {
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
