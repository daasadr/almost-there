import "server-only";
import { getAnthropic } from "./client";
import { env } from "@/lib/env";
import {
  monthlyPlanSchema,
  monthlyPlanJsonSchema,
  type MonthlyPlan,
} from "./schemas";
import { localeAiNames, type Locale } from "@/i18n/routing";

/**
 * Fáze 1 dekompozice cíle: měsíční milníky.
 *
 * Tohle je jádro produktu (zadání, bod 6). Prompt je psaný tak, aby AI
 * plánovala pozpátku od termínu, držela měsíce ověřitelné a byla upřímná,
 * když termín nevychází. Týdenní a denní rozpad je fáze 2 a 3 — generují se
 * až v plné verzi, průběžně, ne dopředu na celý rok.
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
  plan: MonthlyPlan;
  usage: { inputTokens: number; outputTokens: number; model: string };
};

const SYSTEM_PROMPT = `You are the planning engine behind AlmostThere, an app that turns ambitious goals into daily action.

Your job in this step is phase one only: break a goal down into MONTHLY milestones between today and the deadline. Weeks and days are handled by later steps — do not produce them.

How to build the plan:

- Work backwards from the deadline. Ask what must be true at the end to call the goal reached, then what must be true one month before that, and so on back to today.
- Every milestone must be checkable. A person reading it at the end of the month should be able to answer yes or no. "Understand the basics" is not checkable; "can hold a five-minute introduction conversation without notes" is.
- Respect how skills actually build. Early months carry foundations and are lighter in visible output; later months compound. Do not distribute work evenly just to look tidy.
- Leave the final month lighter. It is for consolidation, review and slack — not for new material. Real life eats deadlines.
- Size the plan to the time the person actually has. If they have an hour a day, do not plan a full-time curriculum.
- If several goals are active at once, spread their heavy months apart. Two goals must not both demand a peak effort in the same month.

Be honest about the deadline. If the goal genuinely does not fit the time available at the stated capacity, say so in the feasibility rating and note — a plan that quietly pretends is worse than no plan. Still produce the best possible breakdown either way.

Write the plan in the language you are told to use, including every field. Use the second person ("you"), plain concrete language, and no motivational filler. Never mention that you are an AI or describe your own process.`;

function buildUserPrompt(input: DecomposeInput, monthCount: number): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `Today's date: ${today}`,
    `Goal: ${input.goal}`,
    `Target date: ${input.targetDate}`,
    `Months available: ${monthCount}`,
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
      "Other active goals to schedule around (do not plan them, just avoid piling their heavy months onto the same months):",
      ...input.otherActiveGoals.map(
        (g) => `  - ${g.title} (due ${g.targetDate})`,
      ),
    );
  }

  lines.push(
    "",
    `Produce exactly ${monthCount} monthly milestones, numbered 1 to ${monthCount}.`,
  );

  return lines.join("\n");
}

/** Počet celých měsíců mezi dneškem a termínem, minimálně 1. */
export function monthsUntil(targetDate: string, from = new Date()): number {
  const target = new Date(`${targetDate}T00:00:00Z`);
  const start = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const months =
    (target.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (target.getUTCMonth() - start.getUTCMonth()) +
    (target.getUTCDate() >= start.getUTCDate() ? 0 : -1);
  return Math.max(1, months);
}

export async function decomposeIntoMonths(
  input: DecomposeInput,
): Promise<DecomposeResult> {
  const monthCount = Math.min(monthsUntil(input.targetDate), 36);
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
        schema: monthlyPlanJsonSchema,
      },
    },
    messages: [{ role: "user", content: buildUserPrompt(input, monthCount) }],
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

  const result = monthlyPlanSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiFormatError(
      `Model output did not match the schema: ${result.error.message}`,
    );
  }

  // Přečíslujeme podle pořadí — model občas indexy přeskočí a UI na ně spoléhá.
  const months = result.data.months.map((month, i) => ({
    ...month,
    index: i + 1,
  }));

  return {
    plan: { ...result.data, months },
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
