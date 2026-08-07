import "server-only";
import { callStructured, type AiUsage } from "./call";
import {
  blockChildrenSchema,
  buildChildrenJsonSchema,
  buildDaysJsonSchema,
  weekDaysSchema,
  type ChildBlock,
  type PlannedDay,
} from "./schemas";
import { localeAiNames, type Locale } from "@/i18n/routing";
import { daysInclusive, toIsoDate, type DateRange, type Unit } from "@/lib/plan/calendar";

/**
 * Fáze 2 a 3 rozpadu (zadání, bod 6): z období na kratší úseky a nakonec
 * na konkrétní dny s úkoly.
 *
 * Generuje se vždy jen nejbližší kus, ne celý plán dopředu. Rozepsat
 * desetiletý cíl rovnou na 3650 dní by stálo majlant a k ničemu by to
 * nebylo — plán se do té doby dvacetkrát změní.
 */

export type GoalContext = {
  title: string;
  targetDate: string;
  /** Jak AI cíl pochopila při prvním rozpadu — drží výklad pohromadě. */
  restatement?: string | null;
  locale: Locale;
  dailyCapacityMinutes: number;
  restFrequency: string;
  reflectionMinutesPerDay: number;
};

export type ParentBlock = {
  unit: Unit;
  title?: string | null;
  summary: string;
  range: DateRange;
};

const SHARED_RULES = `Write everything in the language you are told to use. Use the second person ("you"), plain concrete language, no motivational filler. Never mention that you are an AI or describe your own process.

Stay inside the parent period. You are filling in detail for one stretch of an existing plan, not redesigning the goal. Whatever the parent period says must be finished by its end is what you are working towards.`;

const CHILDREN_SYSTEM = `You are the planning engine behind AlmostThere, an app that turns ambitious goals into daily action.

You are given one period of an existing plan and you break it into shorter stretches. Each stretch gets a short label and a statement of what must be true when it ends.

Rules:

- Work backwards from the parent period's own milestone. The last stretch must land exactly on it.
- Every stretch must be checkable — a yes-or-no question at the end of it, not a vague direction.
- Front-load the groundwork and leave the final stretch lighter for consolidation and slack. Things overrun.
- Some stretches are shorter than others because the calendar says so. Expect less from a short one.

${SHARED_RULES}`;

const DAYS_SYSTEM = `You are the planning engine behind AlmostThere, an app that turns ambitious goals into daily action.

You are given one week of an existing plan and you turn it into concrete days. This is the level the person actually looks at each morning, so it has to be usable rather than impressive.

Rules:

- Each task must be something the person can finish and tick off. "Work on the project" is not a task; "draft the opening two paragraphs" is.
- Respect the stated daily capacity. The tasks for one day must add up to at most that many minutes, and usually less. A day that is impossible to finish teaches the person to ignore the plan.
- Rest is a planned item, not what is left over. Honour the stated rest preference: a rest day gets a single REST task and nothing else. Do not quietly schedule work on it.
- Include reflection as its own task when the person has asked for it — reviewing what worked is part of the plan, not an extra.
- Vary the days. Repeating the same task seven times is a sign you have stopped planning.
- The last day of the week should leave a little room. Weeks rarely go exactly as written.

${SHARED_RULES}`;

function unitWord(unit: Unit): string {
  return unit.toLowerCase();
}

function goalLines(goal: GoalContext): string[] {
  const lines = [
    `Goal: ${goal.title}`,
    `Final target date: ${goal.targetDate}`,
    `Write in: ${localeAiNames[goal.locale]}`,
    `Time available per day: about ${goal.dailyCapacityMinutes} minutes`,
    `Rest preference: ${goal.restFrequency}`,
  ];
  if (goal.restatement) {
    lines.splice(1, 0, `How the goal was understood: ${goal.restatement}`);
  }
  if (goal.reflectionMinutesPerDay > 0) {
    lines.push(
      `Reflection: ${goal.reflectionMinutesPerDay} minutes per day, to be built in as its own task`,
    );
  }
  return lines;
}

export type ExpandBlocksResult = {
  children: ChildBlock[];
  usage: AiUsage;
};

/**
 * Rozpad bloku na podbloky: rok → měsíce, měsíc → týdny.
 *
 * `ranges` jsou už spočítané kalendářem, model jen doplňuje obsah.
 * Kdyby si data určoval sám, rozešla by se s tím, co ukazuje aplikace.
 */
export async function expandIntoBlocks({
  goal,
  parent,
  childUnit,
  ranges,
  siblingSummaries,
}: {
  goal: GoalContext;
  parent: ParentBlock;
  childUnit: Unit;
  ranges: DateRange[];
  /** Sousední období nadřazené úrovně — kvůli návaznosti. */
  siblingSummaries?: string[];
}): Promise<ExpandBlocksResult> {
  const child = unitWord(childUnit);

  const lines = [
    ...goalLines(goal),
    "",
    `Parent period (${unitWord(parent.unit)}): ${toIsoDate(parent.range.startDate)} to ${toIsoDate(parent.range.endDate)}`,
    parent.title ? `Parent label: ${parent.title}` : null,
    `What must be true when it ends: ${parent.summary}`,
  ].filter((line): line is string => line !== null);

  if (siblingSummaries?.length) {
    lines.push(
      "",
      "The rest of the plan, for continuity (do not plan these, just do not contradict them):",
      ...siblingSummaries.map((summary, i) => `  ${i + 1}. ${summary}`),
    );
  }

  lines.push(
    "",
    `Break the parent period into exactly ${ranges.length} ${child}s covering these date ranges:`,
    ...ranges.map(
      (range, i) =>
        `  ${i + 1}. ${toIsoDate(range.startDate)} to ${toIsoDate(range.endDate)}` +
        ` (${daysInclusive(range.startDate, range.endDate)} days)`,
    ),
  );

  const { data, usage } = await callStructured({
    system: CHILDREN_SYSTEM,
    user: lines.join("\n"),
    jsonSchema: buildChildrenJsonSchema(child, ranges.length),
    parser: blockChildrenSchema,
  });

  const children = data.children
    .slice(0, ranges.length)
    .map((entry, i) => ({ ...entry, index: i + 1 }));

  return { children, usage };
}

export type ExpandDaysResult = {
  days: PlannedDay[];
  usage: AiUsage;
};

/** Rozpad týdne na dny s konkrétními úkoly — poslední úroveň. */
export async function expandIntoDays({
  goal,
  parent,
  ranges,
  otherGoalMinutesPerDay = 0,
}: {
  goal: GoalContext;
  parent: ParentBlock;
  ranges: DateRange[];
  /**
   * Kolik minut denně už spolykaly ostatní aktivní cíle. Bez toho by si
   * každý cíl bral celou kapacitu a dohromady by den nevyšel (zadání, bod 7).
   */
  otherGoalMinutesPerDay?: number;
}): Promise<ExpandDaysResult> {
  const available = Math.max(
    15,
    goal.dailyCapacityMinutes - otherGoalMinutesPerDay,
  );

  const lines = [
    ...goalLines(goal),
    "",
    `Week being planned: ${toIsoDate(parent.range.startDate)} to ${toIsoDate(parent.range.endDate)}`,
    parent.title ? `Week label: ${parent.title}` : null,
    `What must be true when the week ends: ${parent.summary}`,
    "",
    `Budget for this goal: at most ${available} minutes per day.`,
  ].filter((line): line is string => line !== null);

  if (otherGoalMinutesPerDay > 0) {
    lines.push(
      `The person is also working on other goals that already take about ${otherGoalMinutesPerDay} minutes of their day. The budget above is what is left.`,
    );
  }

  lines.push(
    "",
    `Plan exactly ${ranges.length} days:`,
    ...ranges.map(
      (range, i) =>
        `  ${i + 1}. ${toIsoDate(range.startDate)} (${weekdayName(range.startDate)})`,
    ),
  );

  const { data, usage } = await callStructured({
    system: DAYS_SYSTEM,
    user: lines.join("\n"),
    jsonSchema: buildDaysJsonSchema(ranges.length),
    parser: weekDaysSchema,
  });

  const days = data.days
    .slice(0, ranges.length)
    .map((day, i) => ({ ...day, index: i + 1 }));

  return { days, usage };
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Anglicky — jde do promptu, ne na obrazovku. */
function weekdayName(date: Date): string {
  return WEEKDAYS[date.getUTCDay()];
}
