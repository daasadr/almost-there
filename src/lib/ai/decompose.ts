import "server-only";
import { getAnthropic } from "./client";
import { env } from "@/lib/env";
import {
  planSchema,
  buildPlanJsonSchema,
  type Plan,
  type PlanLevel,
} from "./schemas";
import { localeAiNames, type Locale } from "@/i18n/routing";

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
};

export type DecomposeResult = {
  plan: Plan;
  usage: { inputTokens: number; outputTokens: number; model: string };
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
  count: number,
): string {
  const today = new Date().toISOString().slice(0, 10);
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

/** Kolik období dané jednotky se do horizontu vejde. */
export function periodCount(days: number, level: PlanLevel): number {
  switch (level) {
    case "week":
      return clamp(Math.round(days / 7), 2, 12);
    case "month":
      return clamp(Math.round(days / 30.44), 2, 18);
    case "year":
      return clamp(Math.round(days / 365.25), 2, 15);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function decomposeGoal(
  input: DecomposeInput,
): Promise<DecomposeResult> {
  const days = daysUntil(input.targetDate);
  const level = pickPlanLevel(days);
  const count = periodCount(days, level);
  const model = env.anthropicModel;

  const response = await getAnthropic().messages.create({
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: {
      // Laditelné přes ANTHROPIC_EFFORT — viz komentář v env.ts.
      effort: env.anthropicEffort,
      format: {
        type: "json_schema",
        schema: buildPlanJsonSchema(level),
      },
    },
    messages: [{ role: "user", content: buildUserPrompt(input, level, count) }],
  });

  if (response.stop_reason === "refusal") {
    throw new AiRefusalError(
      response.stop_details?.explanation ?? "Request declined.",
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiFormatError("Model returned no text content.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new AiFormatError("Model returned malformed JSON.");
  }

  const result = planSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiFormatError(
      `Model output did not match the schema: ${result.error.message}`,
    );
  }

  // Přečíslujeme podle pořadí — model občas indexy přeskočí a UI na ně spoléhá.
  const periods = result.data.periods.map((period, i) => ({
    ...period,
    index: i + 1,
  }));

  return {
    plan: { ...result.data, level, periods },
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model,
    },
  };
}

export class AiRefusalError extends Error {
  readonly name = "AiRefusalError";
}

export class AiFormatError extends Error {
  readonly name = "AiFormatError";
}
