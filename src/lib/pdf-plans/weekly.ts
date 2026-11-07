import "server-only";
import { z } from "zod";
import { callStructured, type AiUsage } from "@/lib/ai/call";
import { toIsoDate, type DateRange } from "@/lib/plan/calendar";
import { localeAiNames, type Locale } from "@/i18n/routing";

/**
 * Rozpis období na týdenní úkoly.
 *
 * Vlastní volání, ne `expandIntoDays`. Tamto se ptá na dny a jeho
 * zadání i vzorová odpověď jsou na dny postavené — týdenní seznam by
 * z něj vyšel jako den, který trvá sedm dní, a model by do něj psal
 * úkoly na jedno odpoledne.
 *
 * ── Kdy se tohle hodí víc než dny ───────────────────────────────────
 *
 * U cílů, které se skládají ze zařizování, ne z cvičení. U svatby nemá
 * smysl říkat „v úterý zavolej fotografovi": zavolá se, až to půjde,
 * a důležité je, že se to má stihnout tenhle týden. Rozpis po dnech by
 * tam jen předstíral přesnost, kterou nikdo nedodrží — a první
 * nedodržený den by zpochybnil celý plán.
 */

const weekSchema = z.object({
  index: z.number().int(),
  /** Čím je ten týden daný — jedna věta. */
  summary: z.string().min(1),
  tasks: z.array(
    z.object({
      title: z.string().min(1),
      /** Odhad v minutách. Nula znamená „zařizování, nedá se odhadnout". */
      estimatedMinutes: z.number().int().min(0).max(1440),
    }),
  ),
});

const weeksSchema = z.object({ weeks: z.array(weekSchema).min(1) });

const SYSTEM = `You break one period of a plan into weekly checklists.

Each week gets a handful of things that have to be arranged or finished that week. Not a timetable — the person decides which day to do them on. That is the point of planning in weeks rather than days.

Rules:

- Three to six items a week. More than that and nobody reads it; fewer and the week says nothing.
- Every item is a thing that can be ticked off. "Book the photographer" can. "Think about photography" cannot.
- Put items in the week where they must be *done*, not where they could start. Things with lead times — ordering, booking, anything someone else has to deliver — belong earlier than feels natural, and the item should say why ("the dress needs eight weeks for alterations").
- Items that depend on an earlier decision must come after it. Never ask for the invitations before the venue is fixed.
- The estimate in minutes is for the person's own effort, not for waiting. When it is mostly phoning and waiting, use 0 — a made-up number is worse than none.
- Say what "done" looks like when it is not obvious. "Deposit paid and date confirmed in writing" beats "sort out the venue".
- Write in the language you are told to use. Second person, plain, no filler and no encouragement.`;

function buildJsonSchema(count: number) {
  return {
    type: "object",
    properties: {
      weeks: {
        type: "array",
        description: `Exactly ${count} weeks, in chronological order.`,
        items: {
          type: "object",
          properties: {
            index: {
              type: "integer",
              description: "1-based position of this week in the period.",
            },
            summary: {
              type: "string",
              description: "One sentence on what this week is about.",
            },
            tasks: {
              type: "array",
              description: "Three to six things to finish this week.",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description:
                      "One thing that can be ticked off, in the target language.",
                  },
                  estimatedMinutes: {
                    type: "integer",
                    description:
                      "Own effort in minutes; 0 when it is mostly waiting on someone else.",
                  },
                },
                required: ["title", "estimatedMinutes"],
                additionalProperties: false,
              },
            },
          },
          required: ["index", "summary", "tasks"],
          additionalProperties: false,
        },
      },
    },
    required: ["weeks"],
    additionalProperties: false,
  };
}

export type WeeklySlot = {
  summary: string;
  tasks: { title: string; estimatedMinutes: number }[];
};

export async function expandIntoWeeks({
  goal,
  locale,
  restatement,
  finalChallenge,
  guidance,
  period,
  ranges,
  hoursPerWeek,
}: {
  goal: string;
  locale: Locale;
  restatement?: string;
  finalChallenge?: string;
  /** Odborný pokyn ze šablony. Uživatel ho nevidí. */
  guidance?: string;
  period: { title: string; milestone: string; startDate: Date; endDate: Date };
  ranges: DateRange[];
  hoursPerWeek: number;
}): Promise<{ weeks: WeeklySlot[]; usage: AiUsage }> {
  const lines = [
    `Goal: ${goal}`,
    restatement ? `How the goal was understood: ${restatement}` : null,
    `Write in: ${localeAiNames[locale]}`,
    `Time the person has: about ${hoursPerWeek} hours a week`,
    finalChallenge ? `What it all leads to: ${finalChallenge}` : null,
    "",
    `Period being planned: ${toIsoDate(period.startDate)} to ${toIsoDate(period.endDate)}`,
    `Period label: ${period.title}`,
    `What must be true when the period ends: ${period.milestone}`,
    "",
    `Plan exactly ${ranges.length} weeks:`,
    ...ranges.map(
      (range, i) =>
        `  ${i + 1}. ${toIsoDate(range.startDate)} – ${toIsoDate(range.endDate)}`,
    ),
  ].filter((line): line is string => line !== null);

  if (guidance) {
    lines.push(
      "",
      "Expert guidance for this kind of goal. Follow it over your own instincts:",
      guidance,
    );
  }

  const { data, usage } = await callStructured({
    system: SYSTEM,
    user: lines.join("\n"),
    jsonSchema: buildJsonSchema(ranges.length),
    parser: weeksSchema,
  });

  // Přebytek zahodíme: týden bez data by v dokumentu neměl kam patřit.
  return {
    weeks: data.weeks.slice(0, ranges.length).map((week) => ({
      summary: week.summary,
      tasks: week.tasks,
    })),
    usage,
  };
}
