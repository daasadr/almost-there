/**
 * Kalendářní aritmetika plánu.
 *
 * Období nedělíme na stejně dlouhé kusy, ale podle kalendáře: měsíc končí
 * posledním dnem měsíce, týden nedělí. Kdyby „týden" znamenal libovolných
 * sedm dní od založení cíle, uživatel by si ho nikdy neuměl srovnat
 * s vlastním kalendářem a plán by se čtl mnohem hůř.
 *
 * Všechno počítáme v UTC. Datum je tu den, ne okamžik — a míchání
 * časových pásem do dnů je spolehlivý zdroj chyb o jedničku.
 */

export type Unit = "YEAR" | "MONTH" | "WEEK" | "DAY";

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

const DAY_MS = 86_400_000;

export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Počet dnů z `from` do `to` včetně obou. */
export function daysInclusive(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
}

/**
 * Dnešek v časovém pásmu uživatele.
 *
 * Kdo v Praze odškrtává úkoly v jedenáct večer, nesmí kvůli UTC vidět
 * úkoly na zítřek. `en-CA` je tu jen proto, že formátuje jako YYYY-MM-DD.
 */
export function todayIso(timeZone = "Europe/Prague"): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    // Neznámé pásmo z databáze nesmí shodit celou stránku.
    return new Date().toISOString().slice(0, 10);
  }
}

function endOfYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 11, 31));
}

function endOfMonth(date: Date): Date {
  // Nultý den následujícího měsíce = poslední den tohohle.
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

/** Neděle téhož týdne — týden bereme jako pondělí až neděle. */
function endOfWeek(date: Date): Date {
  const weekday = date.getUTCDay(); // 0 = neděle
  return addDays(date, weekday === 0 ? 0 : 7 - weekday);
}

/**
 * Kdy je zbytek na kraji tak krátký, že nemá cenu z něj dělat vlastní
 * období. Tři dny označené jako „rok 11" vypadají jen jako chyba.
 */
const MERGE_BELOW_DAYS: Record<Unit, number> = {
  YEAR: 60,
  MONTH: 10,
  WEEK: 3,
  DAY: 0,
};

/**
 * Rozdělí rozsah na období dané jednotky, zarovnaná na kalendář.
 * První období začíná přesně v `start` — dny, které už uplynuly,
 * do plánu nepatří.
 */
export function splitRange(start: Date, end: Date, unit: Unit): DateRange[] {
  if (end.getTime() < start.getTime()) return [];

  const ranges: DateRange[] = [];
  let cursor = start;

  while (cursor.getTime() <= end.getTime()) {
    let stop: Date;
    switch (unit) {
      case "YEAR":
        stop = endOfYear(cursor);
        break;
      case "MONTH":
        stop = endOfMonth(cursor);
        break;
      case "WEEK":
        stop = endOfWeek(cursor);
        break;
      case "DAY":
        stop = cursor;
        break;
    }
    if (stop.getTime() > end.getTime()) stop = end;

    ranges.push({ startDate: cursor, endDate: stop });
    cursor = addDays(stop, 1);
  }

  return mergeStubs(ranges, unit);
}

/** Přilepí příliš krátký kraj k sousedovi. */
function mergeStubs(ranges: DateRange[], unit: Unit): DateRange[] {
  const threshold = MERGE_BELOW_DAYS[unit];
  if (threshold <= 0 || ranges.length < 2) return ranges;

  const merged = [...ranges];

  const first = merged[0];
  if (daysInclusive(first.startDate, first.endDate) < threshold) {
    merged[1] = { startDate: first.startDate, endDate: merged[1].endDate };
    merged.shift();
  }

  if (merged.length >= 2) {
    const last = merged[merged.length - 1];
    if (daysInclusive(last.startDate, last.endDate) < threshold) {
      merged[merged.length - 2] = {
        startDate: merged[merged.length - 2].startDate,
        endDate: last.endDate,
      };
      merged.pop();
    }
  }

  return merged;
}

/** O úroveň níž. `DAY` je dno — dál se nedělí. */
export function childUnit(unit: Unit): Unit | null {
  switch (unit) {
    case "YEAR":
      return "MONTH";
    case "MONTH":
      return "WEEK";
    case "WEEK":
      return "DAY";
    case "DAY":
      return null;
  }
}
