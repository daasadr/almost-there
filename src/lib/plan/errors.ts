/**
 * Chybové klíče, které umí přeložit `plan.errors.*`.
 *
 * Server posílá jen kód, text si skládá klient. Kdyby přišel kód, na který
 * překlad není, next-intl by spadl — proto se všechno neznámé mapuje na
 * obecnou hlášku.
 */
const KNOWN = new Set([
  "goalRequired",
  "goalTooShort",
  "goalTooLong",
  "dateRequired",
  "dateTooSoon",
  "dateTooFar",
  "aiFailed",
  "budgetExhausted",
  "planLimitReached",
  "tooManyGoals",
  "notSubscribed",
  "generic",
]);

export type PlanErrorKey = string;

export function planErrorKey(value: unknown): PlanErrorKey {
  return typeof value === "string" && KNOWN.has(value) ? value : "generic";
}
