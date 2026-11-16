import { addDays, toIsoDate } from "@/lib/plan/calendar";
import type { DateRange } from "@/lib/plan/calendar";

/**
 * Roztažení zbytku plánu do pozdějšího termínu.
 *
 * Posunout termín znamená, že obsah zůstává a jen potřebuje víc času.
 * Dřív se kvůli tomu celý zbytek plánu smazal a model napsal nový —
 * tedy přesně naopak: obsah se zahodil a čas zůstal. Člověk, který si
 * nechal posunout termín v polovině cesty, dostal cíl rozplánovaný od
 * začátku a práci několika měsíců nikde.
 *
 * Tady se tedy nepřepisuje nic. Období si nechají název, milník
 * i pořadí a dostanou jen nová data, roztažená v poměru, o kolik se
 * termín posunul.
 *
 * ── Proč se konce berou od souseda ──────────────────────────────────
 *
 * Z výpočtu vycházejí začátky. Kdyby se stejně počítaly i konce,
 * zaokrouhlení by mezi obdobími udělalo sem tam den mezery nebo
 * překryvu — a den, který nepatří do žádného období, je den bez úkolů,
 * na kterém se plán tiše zasekne. Konec období je proto vždycky den
 * před začátkem toho dalšího a poslední sahá přesně na nový termín.
 */

/** Celé dny mezi dvěma daty. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export function stretchRanges({
  blocks,
  anchor,
  oldTarget,
  newTarget,
}: {
  /** Období, která se mají roztáhnout, v pořadí. */
  blocks: DateRange[];
  /**
   * První den, se kterým se smí hýbat.
   *
   * Všechno před ním je minulost nebo běžící období — tedy dny, které
   * už člověk vidí rozepsané a odškrtává je. Kotva je jejich konec,
   * takže roztahování začíná tam, kde končí jistota.
   */
  anchor: Date;
  oldTarget: Date;
  newTarget: Date;
}): DateRange[] {
  if (blocks.length === 0) return [];

  const oldSpan = daysBetween(anchor, oldTarget);
  const newSpan = daysBetween(anchor, newTarget);

  // Zkracovat se tudy nedá a stejný termín nemá co měnit. Obojí je
  // chyba volajícího, ale spadnout kvůli tomu by bylo horší než nechat
  // plán, jak je.
  if (oldSpan <= 0 || newSpan <= oldSpan) return blocks;

  const factor = newSpan / oldSpan;

  const starts: Date[] = [];
  for (const [index, block] of blocks.entries()) {
    const offset = Math.round(daysBetween(anchor, block.startDate) * factor);
    const start = addDays(anchor, offset);
    const previous = starts[index - 1];

    // Pojistka proti slepenému období: u velmi krátkých období by
    // zaokrouhlení mohlo dát dvakrát totéž datum a z jednoho z nich
    // by zbyl prázdný rozsah.
    starts.push(
      previous && start.getTime() <= previous.getTime()
        ? addDays(previous, 1)
        : start,
    );
  }

  return starts.map((startDate, index) => ({
    startDate,
    endDate:
      index === starts.length - 1
        ? newTarget
        : addDays(starts[index + 1], -1),
  }));
}

/**
 * Na které dny se vrátí propadlá práce.
 *
 * Po jednom na den, od zítřka. Dvě dodělávky denně by z dohánění
 * udělaly druhý plán vedle toho skutečného a pravděpodobně by se
 * nestihlo ani jedno; jeden úkol navíc se dá vždycky někam vmáčknout.
 *
 * Dny s odpočinkem se přeskakují. Odpočinek je v plánu položka, ne
 * zbytek — a den, na kterém má stát „dnes nic", není místo, kam
 * propašovat nedodělek z minula.
 */
export function catchUpDates({
  count,
  from,
  restDates = new Set<string>(),
}: {
  count: number;
  /** První den, na který se smí vrátit. */
  from: Date;
  /** Dny odpočinku jako ISO data — ty se přeskakují. */
  restDates?: Set<string>;
}): Date[] {
  const dates: Date[] = [];

  // Strop proti nekonečnu, kdyby přišel nesmyslně velký počet nebo
  // samé odpočinkové dny. Rok dohánění stejně nikdo nedodělá.
  for (let offset = 0; dates.length < count && offset < 400; offset += 1) {
    const day = addDays(from, offset);
    if (restDates.has(toIsoDate(day))) continue;
    dates.push(day);
  }

  return dates;
}
