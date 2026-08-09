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
  /**
   * Co uživatel k cíli dopsal — výchozí úroveň, omezení, co je pro něj
   * důležité. Je to nejcennější vstup, jaký od něj dostaneme: název cíle
   * říká co, tohle říká za jakých okolností.
   */
  context?: string;
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
  /** Když se plán dělá znovu kvůli skluzu — co se dosud stalo. */
  replan?: ReplanContext;
};

export type ReplanContext = {
  /** Milníky období, která už uplynula — jejich obsah je zčásti za námi. */
  pastMilestones: string[];
  /** Podíl hotové práce z toho, co už mělo být hotové (0–1). */
  completionRate: number;
  /** Kolik dní se za poslední dva týdny nedotáhlo. */
  missedDays: number;
  /** Posunul se termín, nebo se skluz dohání ve stejném čase? */
  deadlineMoved: boolean;
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

  if (input.context) {
    lines.push(
      "",
      "What the person added about their situation. Take it seriously — it is",
      "the difference between a generic plan and one that fits them:",
      input.context,
      "",
    );
  }

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
  if (input.replan) {
    lines.push("", buildReplanBlock(input.replan));
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

/**
 * Kontext pro opakovaný rozpad po skluzu.
 *
 * Podstatná je poslední instrukce: nedodělané úkoly se nepřenášejí.
 * Doplňovat je mezi nadcházející dny je nejspolehlivější způsob, jak
 * plán zabít — kupka roste rychleji, než se dá odbourat. Přenáší se
 * to, co z milníku ještě chybí, ne seznam propadlých položek.
 */
function buildReplanBlock(replan: ReplanContext): string {
  const percent = Math.round(replan.completionRate * 100);

  const lines = [
    "This is a REPLAN of a goal already in progress, not a new goal.",
    "",
    `Completion so far: ${percent}% of the work that was already due got done.`,
    `Days missed in the last two weeks: ${replan.missedDays}.`,
    replan.deadlineMoved
      ? "The deadline has been moved to the date given above, at the person's request. Plan to the new date at a pace they can actually keep — the old one was not it."
      : "The deadline is unchanged, at the person's request. They want to catch up. Say plainly in the feasibility note if that no longer fits, and plan the most honest version of it either way.",
  ];

  if (replan.pastMilestones.length) {
    lines.push(
      "",
      "What the earlier plan asked for in the periods that have already passed. Treat it as partly done — around the completion rate above — and pick up from there:",
      ...replan.pastMilestones.map((milestone) => `  - ${milestone}`),
    );
  }

  lines.push(
    "",
    "Do not carry unfinished tasks over one by one. Work out what is still missing from those earlier milestones and fold it into the new plan where it still matters; drop what has been overtaken by events. A plan that stacks yesterday's leftovers onto today gets abandoned within a week.",
    "Do not reproach the person anywhere in the plan. They know. Write it as if starting from where they are today.",
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
