import type { DateRange } from "@/lib/plan/calendar";

/**
 * Dny, na které se neplánuje.
 *
 * Čísla jako v JavaScriptu: 0 je neděle, 6 sobota. Volí je uživatel
 * při objednávce, protože volno není u každého o víkendu — kdo pracuje
 * na směny nebo má děti každý druhý týden, potřebuje jiné dny, a plán,
 * který mu zaplní jediné volné odpoledne, skončí v koši.
 *
 * Čistý modul bez závislostí na databázi i na modelu, aby se dal
 * vyzkoušet: špatně spočítané volno se v hotovém PDF pozná těžko,
 * protože dní je osmdesát a chybět bude jeden.
 */

export const SUNDAY = 0;
export const SATURDAY = 6;

/** Obvyklá volba, předvyplněná ve formuláři. */
export const WEEKEND = [SATURDAY, SUNDAY];

/**
 * Aspoň jeden den musí zbýt. Kdo si odškrtne všech sedm, nechce plán;
 * nejspíš jen zkouší, co to udělá.
 */
export const MAX_REST_DAYS = 6;

/** Jsou to platné dny v týdnu, bez opakování a ne všechny? */
export function validRestDays(days: number[]): boolean {
  if (days.length > MAX_REST_DAYS) return false;
  if (new Set(days).size !== days.length) return false;
  return days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}

/**
 * Z rozsahů dní vybere ty, na které se plánuje.
 *
 * Volné dny se zahazují **ze zadání**, ne z odpovědi modelu. Kdyby se
 * mu nabídly všechny a jen se mu řeklo, ať víkend vynechá, občas by ho
 * tam stejně napsal — a škrtat den z hotové odpovědi znamená zahodit
 * práci, za kterou se zaplatilo.
 */
export function workingDays(
  ranges: DateRange[],
  restDays: number[],
): DateRange[] {
  if (restDays.length === 0) return ranges;

  const rest = new Set(restDays);
  return ranges.filter((range) => !rest.has(range.startDate.getUTCDay()));
}

const NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Věta o volnu pro model. Anglicky, jde do zadání.
 *
 * Dny se mu sice stejně nenabídnou, ale ví díky tomu, proč plán
 * přeskakuje — bez toho se občas snaží ztracený den dohnat tím, že
 * sousední přetíží.
 */
export function restFrequencyFor(restDays: number[]): string {
  if (restDays.length === 0) return "no fixed rest days";

  const names = [...restDays]
    .sort((a, b) => a - b)
    .map((day) => NAMES[day])
    .join(", ");

  return `always free on: ${names}. Those days are not in the plan at all; do not move work onto the days around them to make up for it.`;
}
