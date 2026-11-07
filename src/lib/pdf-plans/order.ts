import { MAX_WEEKS, MIN_WEEKS } from "./pricing";
import { validRestDays } from "./rest-days";
import type { Granularity } from "./plan";

/**
 * Zadání jednorázového plánu, než se z něj stane objednávka.
 *
 * Čistá část: počítání týdnů a kontrola zadání. Odděleně od databáze
 * a od Stripu, aby se dala vyzkoušet — právě tady se dá udělat chyba,
 * která se pozná až na výpisu z účtu.
 */

/** Nejkratší a nejdelší popis cíle. Stejné meze jako u cílů v aplikaci. */
export const TITLE_MIN = 10;
export const TITLE_MAX = 200;
export const TEXT_MAX = 1000;

/** Kolik hodin týdně má smysl plánovat. */
export const HOURS_MIN = 1;
export const HOURS_MAX = 40;

/**
 * Kolik týdnů zbývá od začátku k termínu, zaokrouhleno nahoru.
 *
 * Nahoru schválně: deset a půl týdne je jedenáctitýdenní plán, ne
 * desetitýdenní. Kdyby se zaokrouhlovalo dolů, poslední dny by
 * v plánu chyběly a termín by nevyšel.
 *
 * Počítá se z kalendářních dat, ne z času — jinak by o pásmo posunutý
 * půlnoční okamžik přidal nebo ubral celý týden.
 */
export function weeksBetween(startIso: string, targetIso: string): number {
  const start = Date.parse(`${startIso}T00:00:00Z`);
  const target = Date.parse(`${targetIso}T00:00:00Z`);

  if (Number.isNaN(start) || Number.isNaN(target)) return 0;

  const days = Math.round((target - start) / 86_400_000);
  if (days <= 0) return 0;

  return Math.ceil(days / 7);
}

export type OrderDraft = {
  title: string;
  description?: string;
  startingPoint?: string;
  templateId?: string;
  hoursPerWeek: number;
  /** Dnešek v pásmu uživatele, RRRR-MM-DD. */
  startIso: string;
  /** Kdy to má být hotové, RRRR-MM-DD. */
  targetIso: string;
  /** Zaškrtnutý souhlas s okamžitým dodáním. Bez něj se neplatí. */
  consent: boolean;
  /** Podrobnost ze šablony, ne od uživatele. */
  granularity: Granularity;
  /** Dny, na které se neplánuje. U týdenní podrobnosti se neřeší. */
  restDays: number[];
};

export type DraftError =
  | "titleTooShort"
  | "titleTooLong"
  | "textTooLong"
  | "hoursOutOfRange"
  | "dateTooSoon"
  | "dateTooFar"
  | "restDaysInvalid"
  | "consentRequired";

export type DraftCheck =
  | { ok: true; weeks: number }
  | { ok: false; error: DraftError };

/**
 * Projde zadání a spočítá počet týdnů, podle kterého se určí cena.
 *
 * Vrací první nalezenou chybu, ne jejich seznam: formulář má jedno
 * pole po druhém a dlouhý výčet by jen odradil.
 */
export function checkDraft(draft: OrderDraft): DraftCheck {
  const title = draft.title.trim();
  if (title.length < TITLE_MIN) return { ok: false, error: "titleTooShort" };
  if (title.length > TITLE_MAX) return { ok: false, error: "titleTooLong" };

  for (const text of [draft.description, draft.startingPoint]) {
    if (text && text.trim().length > TEXT_MAX) {
      return { ok: false, error: "textTooLong" };
    }
  }

  if (
    !Number.isInteger(draft.hoursPerWeek) ||
    draft.hoursPerWeek < HOURS_MIN ||
    draft.hoursPerWeek > HOURS_MAX
  ) {
    return { ok: false, error: "hoursOutOfRange" };
  }

  /*
   * Volné dny se kontrolují, i když je vybírá naše zaškrtávátko:
   * požadavek může přijít odkudkoliv a sedm volných dnů by znamenalo
   * plán bez jediného pracovního dne.
   */
  if (!validRestDays(draft.restDays)) {
    return { ok: false, error: "restDaysInvalid" };
  }

  const weeks = weeksBetween(draft.startIso, draft.targetIso);
  if (weeks < MIN_WEEKS) return { ok: false, error: "dateTooSoon" };
  if (weeks > MAX_WEEKS[draft.granularity]) {
    return { ok: false, error: "dateTooFar" };
  }

  /*
   * Souhlas až nakonec, aby se člověk nedozvěděl „zaškrtni souhlas"
   * u zadání, které stejně neprojde. Kontroluje se i na serveru,
   * přestože zaškrtávátko je povinné i ve formuláři: bez něj by
   * u digitálního obsahu dodaného hned nezanikla lhůta na odstoupení
   * a šlo by odstoupit i po stažení PDF.
   */
  if (!draft.consent) return { ok: false, error: "consentRequired" };

  return { ok: true, weeks };
}
