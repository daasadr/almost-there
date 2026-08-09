import { z } from "zod";
import { locales } from "@/i18n/routing";

/**
 * Validace demo formuláře. Sdílená klientem i serverem, aby chyby
 * seděly na obou stranách. Klíče chyb odpovídají `demo.errors.*`
 * v překladech — server nikdy neposílá hotový text, jen kód.
 */

/**
 * Kratší než dva týdny už není plán, ale seznam úkolů na tenhle týden —
 * a delší než deset let je věštění, ne plánování. Uvnitř tohohle rozpětí
 * si horní úroveň rozpadu (roky / měsíce / týdny) volí sama dekompozice.
 */
export const MIN_DAYS_AHEAD = 14;
/** 366 × 10, ne 365 × 10 — jinak by kvůli přestupným rokům neprošlo
 *  datum „přesně za deset let“, které si uživatel vybere v kalendáři. */
export const MAX_DAYS_AHEAD = 366 * 10;
export const MAX_GOAL_LENGTH = 300;

/**
 * V plné verzi je cíl rozdělený na dvě pole.
 *
 * Název je to, co uživatel uvidí v seznamu a v denním checklistu, takže
 * musí být krátký. Podrobnosti jdou do druhého pole a míří hlavně do
 * promptu — právě z nich vzniká plán, který sedí konkrétnímu člověku,
 * a ne obecné šabloně.
 */
export const MIN_GOAL_TITLE = 3;
export const MAX_GOAL_TITLE = 80;
export const MAX_GOAL_DETAIL = 2000;
export const MIN_GOAL_LENGTH = 8;

export function validateGoalTitle(title: string): "goalRequired" | "nameTooShort" | "nameTooLong" | null {
  const trimmed = title.trim();
  if (!trimmed) return "goalRequired";
  if (trimmed.length < MIN_GOAL_TITLE) return "nameTooShort";
  if (trimmed.length > MAX_GOAL_TITLE) return "nameTooLong";
  return null;
}

export type DemoErrorKey =
  | "goalRequired"
  | "goalTooShort"
  | "goalTooLong"
  | "dateRequired"
  | "dateTooSoon"
  | "dateTooFar"
  | "rateLimited"
  | "aiFailed"
  | "generic";

export const demoRequestSchema = z.object({
  goal: z.string(),
  targetDate: z.string(),
  locale: z.enum(locales),
});

export type DemoRequest = z.infer<typeof demoRequestSchema>;

/** Datum v UTC bez času — porovnáváme dny, ne okamžiky. */
function startOfDayUtc(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round(
    (startOfDayUtc(to) - startOfDayUtc(from)) / (24 * 60 * 60 * 1000),
  );
}

export function validateGoal(goal: string): DemoErrorKey | null {
  const trimmed = goal.trim();
  if (!trimmed) return "goalRequired";
  if (trimmed.length < MIN_GOAL_LENGTH) return "goalTooShort";
  if (trimmed.length > MAX_GOAL_LENGTH) return "goalTooLong";
  return null;
}

export function validateTargetDate(
  targetDate: string,
  now = new Date(),
): DemoErrorKey | null {
  if (!targetDate) return "dateRequired";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return "dateRequired";

  const parsed = new Date(`${targetDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "dateRequired";

  const days = daysBetween(now, parsed);
  if (days < MIN_DAYS_AHEAD) return "dateTooSoon";
  if (days > MAX_DAYS_AHEAD) return "dateTooFar";
  return null;
}

/** Rozumné výchozí datum ve formuláři: šest měsíců dopředu. */
export function defaultTargetDate(now = new Date()): string {
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 6, now.getUTCDate()),
  );
  return date.toISOString().slice(0, 10);
}

export function minTargetDate(now = new Date()): string {
  const date = new Date(startOfDayUtc(now) + MIN_DAYS_AHEAD * 86400000);
  return date.toISOString().slice(0, 10);
}

export function maxTargetDate(now = new Date()): string {
  const date = new Date(startOfDayUtc(now) + MAX_DAYS_AHEAD * 86400000);
  return date.toISOString().slice(0, 10);
}
