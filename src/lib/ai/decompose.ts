import "server-only";
import { callStructured, type AiUsage } from "./call";
import {
  planSchema,
  buildPlanJsonSchema,
  type Plan,
  type PlanLevel,
} from "./schemas";
import { localeAiNames, type Locale } from "@/i18n/routing";
import {
  daysInclusive,
  parseIsoDate,
  splitRange,
  toIsoDate,
  todayIso,
  type DateRange,
  type Unit,
} from "@/lib/plan/calendar";

// Chyby žijí v call.ts, ale volající je znají odsud — necháváme je tu
// viditelné, ať se kvůli refaktoru nemusí přepisovat importy.
export { AiRefusalError, AiFormatError } from "./call";

/**
 * Fáze 1 dekompozice cíle: nejvyšší úroveň plánu.
 *
 * Tohle je jádro produktu (zadání, bod 6). Prompt je psaný tak, aby AI
 * plánovala pozpátku od termínu, držela období ověřitelná a byla upřímná,
 * když termín nevychází.
 *
 * Nižší úrovně (týdny, dny) generuje plná verze průběžně — vždy jen na
 * dohlednou budoucnost. Cíl na deset let se tedy nejdřív rozpadne na roky,
 * podrobně se rozpracuje jen ten nejbližší, a další rok se rozpracuje, až
 * se k němu dojde. Šetří to tokeny a hlavně: plán, který se stejně za rok
 * změní, nemá cenu generovat dopředu.
 */

export type DecomposeInput = {
  goal: string;
  /** ISO datum (YYYY-MM-DD). */
  targetDate: string;
  /** Jazyk, ve kterém má být plán napsaný. */
  locale: Locale;
  /** Preference odpočinku a reflexe — v demu se nesbírají, v plné verzi ano. */
  restFrequency?: string;
  reflectionMinutesPerDay?: number;
  /** Kolik minut denně má uživatel reálně k dispozici. */
  dailyCapacityMinutes?: number;
  /** Ostatní aktivní cíle — kvůli harmonizaci (fáze 2 produktu). */
  otherActiveGoals?: { title: string; targetDate: string }[];
  /** Dnešek v pásmu uživatele. V demu se nezadává a bere se UTC. */
  today?: string;
};

export type DecomposeResult = {
  plan: Plan;
  usage: AiUsage;
  /** Kalendářní rozsahy období — v tomtéž pořadí jako `plan.periods`. */
  ranges: DateRange[];
};

const SYSTEM_PROMPT = `You are the planning engine behind AlmostThere, an app that turns ambitious goals into daily action.

Your job in this step is the top level of the breakdown only. You will be told which unit to work in — years, months or weeks. Produce milestones in that unit and nothing finer; later steps handle the levels below.

How to build the plan:

- Work backwards from the deadline. Ask what must be true at the end to call the goal reached, then what must be true one period before that, and so on back to today.
- Every milestone must be checkable. A person reading it at the end of the period should be able to answer yes or no. "Understand the basics" is not checkable; "can hold a five-minute introduction conversation without notes" is.
- Respect how progress actually compounds. Early periods carry foundations and are lighter in visible output; later ones build on them. Do not distribute work evenly just to look tidy.
- Leave the final period lighter. It is for consolidation, review and slack — not for new material. Real life eats deadlines.
- Size the plan to the time the person actually has. If they have an hour a day, do not plan a full-time curriculum.
- If several goals are active at once, spread their heavy periods apart. Two goals must not both demand a peak effort at the same time.

Be honest about the deadline. If the goal genuinely does not fit the time available at the stated capacity, say so in the feasibility rating and note — a plan that quietly pretends is worse than no plan. Still produce the best possible breakdown either way.

Write the plan in the language you are told to use, including every field. Use the second person ("you"), plain concrete language, and no motivational filler. Never mention that you are an AI or describe your own process.`;

/** Doplňující instrukce podle zvolené jednotky. */
const LEVEL_GUIDANCE: Record<PlanLevel, string> = {
  year: `You are working in YEARS because this goal spans a long horizon.

Long-horizon plans are estimates, not schedules. Keep each year's milestone strategic — the state the person needs to have reached by the end of that year — rather than a list of activities. Later years are necessarily rougher than the first; that is expected, and the plan will be revisited as they approach. Say what changes qualitatively from year to year: what exists at the end of year two that did not exist at the end of year one.

For goals that depend on other people, money or market conditions, name what the year hinges on rather than pretending it is fully in the person's control.`,
  month: `You are working in MONTHS.`,
  week: `You are working in WEEKS because the deadline is close.

With a short horizon, be concrete. Each week's milestone should read like something the person could show someone at the end of that week.`,
};

function buildUserPrompt(
  input: DecomposeInput,
  level: PlanLevel,
  ranges: DateRange[],
  today: string,
): string {
  const count = ranges.length;
  const unit = level === "year" ? "year" : level === "month" ? "month" : "week";

  const lines = [
    `Today's date: ${today}`,
    `Goal: ${input.goal}`,
    `Target date: ${input.targetDate}`,
    `Planning unit: ${unit}`,
    `${unit}s available: ${count}`,
    `Write the plan in: ${localeAiNames[input.locale]}`,
  ];

  if (input.dailyCapacityMinutes) {
    lines.push(
      `Time available per day: about ${input.dailyCapacityMinutes} minutes`,
    );
  }
  if (input.restFrequency) {
    lines.push(`Rest preference: ${input.restFrequency}`);
  }
  if (input.reflectionMinutesPerDay) {
    lines.push(
      `Reflection: ${input.reflectionMinutesPerDay} minutes per day, to be built into the plan`,
    );
  }
  if (input.otherActiveGoals?.length) {
    lines.push(
      "Other active goals to schedule around (do not plan them, just avoid piling their heavy periods onto the same time):",
      ...input.otherActiveGoals.map(
        (g) => `  - ${g.title} (due ${g.targetDate})`,
      ),
    );
  }

  // Konkrétní data období. Bez nich model neví, že první měsíc může být
  // useknutý na pár dní, a naplánoval by do něj plnou porci práce.
  lines.push(
    "",
    `The ${count} ${unit}s cover these exact date ranges:`,
    ...ranges.map(
      (range, i) =>
        `  ${i + 1}. ${toIsoDate(range.startDate)} to ${toIsoDate(range.endDate)}` +
        ` (${daysInclusive(range.startDate, range.endDate)} days)`,
    ),
    "Some ranges are shorter than a full calendar period. Scale what you expect from them accordingly.",
  );

  lines.push(
    "",
    LEVEL_GUIDANCE[level],
    "",
    `Produce exactly ${count} milestones, numbered 1 to ${count}.`,
  );

  return lines.join("\n");
}

/** Počet celých dnů mezi dneškem a termínem. */
export function daysUntil(targetDate: string, from = new Date()): number {
  const target = Date.parse(`${targetDate}T00:00:00Z`);
  const start = Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  );
  return Math.max(0, Math.round((target - start) / 86_400_000));
}

/**
 * Jak hluboko má smysl jít na nejvyšší úrovni.
 *
 * Hranice jsou volené tak, aby výsledek měl vždy zhruba 4–15 položek —
 * dost na to, aby byl plán vidět, a málo na to, aby se dal přečíst.
 * Čtyřletý cíl rozdělený na 48 měsíců nikdo nepřečte; třítýdenní cíl
 * rozdělený na měsíce zas nemá co říct.
 */
export function pickPlanLevel(days: number): PlanLevel {
  if (days <= 70) return "week"; // do zhruba deseti týdnů
  if (days <= 550) return "month"; // do zhruba osmnácti měsíců
  return "year";
}

/** Úroveň plánu jako jednotka kalendáře. */
export function planUnit(level: PlanLevel): Unit {
  return level.toUpperCase() as Unit;
}

export async function decomposeGoal(
  input: DecomposeInput,
): Promise<DecomposeResult> {
  const today = input.today ?? todayIso("UTC");
  const days = daysUntil(input.targetDate, parseIsoDate(today));
  const level = pickPlanLevel(days);

  // Počet období si nevymýšlíme — vyplyne z kalendáře. Kdybychom modelu
  // řekli jiné číslo, než na kolik rozsah reálně vychází, nesedělo by
  // pak přiřazení období k datům.
  const ranges = splitRange(
    parseIsoDate(today),
    parseIsoDate(input.targetDate),
    planUnit(level),
  );

  const { data, usage } = await callStructured({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input, level, ranges, today),
    jsonSchema: buildPlanJsonSchema(level),
    parser: planSchema,
  });

  // Počet období modelu zadáváme, ale vynutit se nedá. Přebytek zahodíme —
  // období bez data by v UI nemělo kam patřit — a přečíslujeme podle pořadí,
  // protože model občas indexy přeskočí.
  const periods = data.periods.slice(0, ranges.length).map((period, i) => ({
    ...period,
    index: i + 1,
  }));

  return {
    plan: { ...data, level, periods },
    usage,
    ranges: fitRanges(ranges, periods.length),
  };
}

/**
 * Zkrátí rozsahy na počet období, která model vrátil. Poslední se přitom
 * natáhne až k původnímu konci — cíl nesmí skončit dřív, než má termín.
 */
function fitRanges(ranges: DateRange[], wanted: number): DateRange[] {
  if (wanted >= ranges.length) return ranges;

  const kept = ranges.slice(0, wanted);
  kept[wanted - 1] = {
    startDate: kept[wanted - 1].startDate,
    endDate: ranges[ranges.length - 1].endDate,
  };
  return kept;
}
