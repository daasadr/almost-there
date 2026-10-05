import type { Locale } from "@/i18n/routing";
import { business } from "./business";
import { health } from "./health";
import { home } from "./home";
import { learning } from "./learning";

/**
 * Šablony cílů.
 *
 * Prázdné políčko „jaký je tvůj cíl?" je nejtěžší okamžik v celé
 * aplikaci — a zároveň místo, kde se rozhoduje kvalita plánu. Kdo napíše
 * „zhubnout", dostane průměrný plán; ne proto, že by model neuměl, ale
 * protože zadání neneslo nic, z čeho by se dal udělat lepší.
 *
 * Šablona tedy nešetří klikání. Nese odbornost.
 *
 * ── Tři vrstvy, každá pro někoho jiného ─────────────────────────────
 *
 *  1. `pitch` a `what` — pro člověka, který se rozhoduje. Proč zrovna
 *     tohle a co z toho bude.
 *  2. `questions` — pro člověka, který už se rozhodl. Ptají se na to,
 *     co model nikdy neuhodne.
 *  3. `guidance` — **pro model, uživatel ji nevidí.** Tady je uložené,
 *     jak se takový cíl dělá správně.
 *
 * Třetí vrstva je ta, na které stojí kvalita výstupu. Zbytek rozhoduje
 * o tom, jestli si šablonu někdo vybere; tahle o tom, jestli mu k něčemu
 * bude.
 *
 * ── Proč je `guidance` anglicky a jen jednou ────────────────────────
 *
 * Plán vzniká v jazyce uživatele, ale tohle není text pro čtenáře — je
 * to instrukce pro model. Ve třech jazycích by se laděním jedné verze
 * zbylé dvě tiše rozešly a nikdo by si toho nevšiml, protože to nikdo
 * nečte. Jedno místo, jeden jazyk, jedna pravda.
 *
 * ── Jak psát `guidance` ─────────────────────────────────────────────
 *
 * Ne obecné rady. Model obecné rady zná. Sem patří to, co ví jen ten,
 * kdo to dělal:
 *
 *  - **pořadí**, které se nedá přeskočit (základy před tempem)
 *  - **obvyklá chyba**, kvůli které to lidé vzdají
 *  - **čím měřit postup**, aby to nebylo podle pocitu
 *  - **co do plánu nepatří**, i když se to nabízí
 *  - **kde ubrat**, když člověk nestíhá — plán se bude přizpůsobovat
 *    a musí vědět, co obětovat jako první
 *
 * Tohle je to místo, které se má ladit donekonečna. Čím lepší je, tím
 * víc se plán liší od toho, co by si člověk vygoogloval.
 *
 * ── Pořadí a `id` ───────────────────────────────────────────────────
 *
 * `id` je stabilní klíč: jde do adresy, do statistik a do záznamu
 * u cíle. Nikdy se nemění, ani když se přepíše název. Pořadí v seznamu
 * je věc zobrazení a měnit se smí.
 */

/** Oblasti v pořadí, ve kterém se zobrazují. */
export const templateAreas = [
  "business",
  "health",
  "learning",
  "home",
] as const;

export type TemplateArea = (typeof templateAreas)[number];

/** Otázka do dotazníku. Jedna věc, na kterou umí odpovědět jen uživatel. */
export type TemplateQuestion = {
  /** Klíč do odpovědí. Stabilní, nemění se s překladem. */
  id: string;
  label: string;
  /** Příklady v závorce, ať je vidět, jaká odpověď se čeká. */
  hint?: string;
};

/** Co uživatel u šablony uvidí. Jazyková verze. */
export type TemplateText = {
  title: string;
  /** Proč zrovna tahle. Jedna dvě věty, které mají zaujmout. */
  pitch: string;
  /** Co šablona udělá. Věcně, bez marketingu. */
  what: string;
  /** Komu sedne. Ať se pozná ten, kdo váhá mezi dvěma. */
  forWhom: string;
  /**
   * Čím plán postupně prochází. Tři až pět kroků.
   *
   * Tohle je na veřejné stránce šablony to jediné, co jinde nenajdeš,
   * a zároveň to jediné, co někoho přesvědčí: ne „pomůžeme ti“, ale
   * co se děje první měsíc a co třetí. Vychází z `guidance`, takže se
   * slibuje přesně to, co plán opravdu udělá.
   */
  phases: { when: string; what: string }[];
  /**
   * Co se škrtne, když se přestane stíhat.
   *
   * Jedna věta, a je to ta nejcennější na celé stránce. Každý plán se
   * dřív nebo později rozejde se skutečností a tohle je rozdíl mezi
   * plánem, který to ustojí, a seznamem předsevzetí. Navíc to nikdo
   * jiný neříká dopředu.
   */
  whenBehind: string;
  /** Předvyplněné zadání cíle. Uživatel ho může poupravit. */
  goal: string;
  questions: TemplateQuestion[];
};

export type GoalTemplate = {
  id: string;
  area: TemplateArea;
  /** Rozumný výchozí termín v měsících. Uživatel ho může změnit. */
  defaultMonths: number;
  /** Odborný pokyn pro model. Anglicky, jednou pro všechny jazyky. */
  guidance: string;
  text: Record<Locale, TemplateText>;
};

const ALL: GoalTemplate[] = [...business, ...health, ...learning, ...home];

/**
 * Jazyky musí mít všechny stejné šablony. Chybějící překlad by znamenal
 * prázdnou kartičku v seznamu, ne chybu — a takové věci se objeví až
 * u uživatele. Padne to při sestavení.
 */
function assertComplete(): void {
  const locales: Locale[] = ["cs", "en", "de"];
  for (const template of ALL) {
    for (const locale of locales) {
      if (!template.text[locale]?.title) {
        throw new Error(
          `Šablona „${template.id}" nemá text pro jazyk ${locale}.`,
        );
      }
    }
  }

  const ids = ALL.map((t) => t.id);
  const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
  if (duplicate) {
    throw new Error(`Dvě šablony mají stejné id: „${duplicate}".`);
  }
}

assertComplete();

export const templates = ALL;

export function templateById(id: string): GoalTemplate | undefined {
  return ALL.find((template) => template.id === id);
}

export function templatesByArea(area: TemplateArea): GoalTemplate[] {
  return ALL.filter((template) => template.area === area);
}
