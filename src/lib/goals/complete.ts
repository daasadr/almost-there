import "server-only";
import { db } from "@/lib/db";
import { callStructured } from "@/lib/ai/call";
import { recordUsage } from "@/lib/ai/usage";
import { env } from "@/lib/env";
import { localeAiNames, type Locale } from "@/i18n/routing";
import { z } from "zod";

/**
 * Uzavření dotaženého cíle.
 *
 * Většina lidí svůj cíl nedotáhne. Ti, kdo ano, za sebou mají měsíce
 * drobné vytrvalosti, kterou nikdo neviděl — a od aplikace si zaslouží
 * něco lepšího než změnu stavu v databázi a řádek „splněno“.
 *
 * Shrnutí píše model, protože obecné „gratulujeme“ nikoho nedojme, kdežto
 * věta o tom, čím ten člověk konkrétně prošel, ano. Ukládá se, aby bylo
 * pokaždé stejné — vzpomínka, která se při každém otevření mění, není
 * vzpomínka.
 */

export type CompletionStats = {
  days: number;
  tasksDone: number;
  restDays: number;
  milestones: number;
};

const noteSchema = z.object({
  note: z.string().min(1),
});

const SYSTEM = `You write the closing note a goal-planning app shows to someone who has just finished a long goal.

This is the one moment in the product that is purely theirs. Most people who set a goal never get here.

Rules:

- Two or three sentences. Shorter is stronger.
- Say what they actually went through, using the numbers and the plan you are given. Concrete beats effusive: the number of days they kept at it says more than any adjective.
- No exclamation marks, no confetti language, no "you are amazing". Quiet recognition from someone who watched it happen.
- Do not give advice, do not suggest a next goal, do not sell anything.
- Address them directly, in the language you are told to use.`;

export async function completeGoal(goalId: string): Promise<void> {
  const goal = await db.goal.findUniqueOrThrow({
    where: { id: goalId },
    select: {
      id: true,
      userId: true,
      title: true,
      locale: true,
      restatement: true,
      createdAt: true,
      timeBlocks: {
        where: { parentBlockId: null },
        orderBy: { position: "asc" },
        select: { summary: true },
      },
    },
  });

  const stats = await collectStats(goalId, goal.createdAt);
  const note = await writeNote(goal, stats);

  await db.goal.update({
    where: { id: goalId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completionNote: note,
    },
  });
}

async function collectStats(
  goalId: string,
  createdAt: Date,
): Promise<CompletionStats> {
  const [tasksDone, restDays, milestones] = await Promise.all([
    db.task.count({ where: { goalId, status: "DONE" } }),
    db.task.count({ where: { goalId, type: "REST", status: "DONE" } }),
    db.timeBlock.count({ where: { goalId, parentBlockId: null } }),
  ]);

  return {
    days: Math.max(
      1,
      Math.round((Date.now() - createdAt.getTime()) / 86_400_000),
    ),
    tasksDone,
    restDays,
    milestones,
  };
}

function asLocale(value: string): Locale {
  return (value === "cs" || value === "de" ? value : "en") as Locale;
}

/**
 * Shrnutí od modelu. Když selže, cíl se uzavře i tak — přijít kvůli
 * výpadku o možnost cíl dokončit by bylo mnohem horší než chybějící věta.
 */
async function writeNote(
  goal: {
    userId: string;
    title: string;
    locale: string;
    restatement: string | null;
    timeBlocks: { summary: string }[];
  },
  stats: CompletionStats,
): Promise<string | null> {
  const lines = [
    `Goal reached: ${goal.title}`,
    goal.restatement ? `As it was understood at the start: ${goal.restatement}` : null,
    `Write in: ${localeAiNames[asLocale(goal.locale)]}`,
    "",
    `Days from setting the goal to finishing it: ${stats.days}`,
    `Tasks ticked off: ${stats.tasksDone}`,
    `Of those, deliberate rest days taken: ${stats.restDays}`,
    `Stages the plan was broken into: ${stats.milestones}`,
  ].filter((line): line is string => line !== null);

  if (goal.timeBlocks.length) {
    lines.push(
      "",
      "What the plan asked of them along the way:",
      ...goal.timeBlocks.slice(0, 12).map((block) => `  - ${block.summary}`),
    );
  }

  try {
    const { data, usage } = await callStructured({
      system: SYSTEM,
      user: lines.join("\n"),
      jsonSchema: {
        type: "object",
        properties: {
          note: {
            type: "string",
            description:
              "Two or three sentences of quiet recognition, in the target language.",
          },
        },
        required: ["note"],
        additionalProperties: false,
      },
      parser: noteSchema,
      maxTokens: 2000,
      model: env.aiBlocksModel,
      effort: "low",
    });

    await recordUsage({
      userId: goal.userId,
      operation: "GOAL_COMPLETED",
      usage,
      label: `uzavření cíle „${goal.title}“`,
    });

    return data.note;
  } catch (error) {
    console.error("[goals] závěrečné shrnutí se nepovedlo", error);
    return null;
  }
}

export type FinishState = {
  /** Má se aplikace sama zeptat „máš to?“. */
  ready: boolean;
  /** Kolik úkolů zůstalo neodškrtaných. */
  pending: number;
};

/**
 * Kdy se zeptat na dotažení a co u toho zmínit.
 *
 * Ptát se moc brzy je otravné, ptát se pozdě znamená, že dotažený cíl
 * visí mezi rozdělanými. Stačí jedno z toho: blíží se termín, nebo je
 * odškrtaná drtivá většina toho, co plán chtěl.
 *
 * Odškrtání všeho se ale nevyžaduje. Plán je návrh, ne podmínka —
 * a hlavně: budoucí týdny se generují průběžně, takže u cíle dotaženého
 * dřív spousta úkolů ani neexistuje a odškrtnout by nešly. Aplikace, která
 * člověku řekne „ne, ty jsi svého cíle nedosáhl“, protože se jí nesouhlasí
 * počet políček, si plete plán se skutečností.
 */
export async function getFinishState(
  goalId: string,
  targetDate: Date,
): Promise<FinishState> {
  const [total, done, pending] = await Promise.all([
    db.task.count({ where: { goalId } }),
    db.task.count({ where: { goalId, status: "DONE" } }),
    db.task.count({ where: { goalId, status: "PENDING" } }),
  ]);

  const weekBeforeTarget = new Date(targetDate.getTime() - 7 * 86_400_000);
  const nearDeadline = Date.now() >= weekBeforeTarget.getTime();
  // Pod deset úkolů je málo na to, aby poměr něco znamenal.
  const mostlyDone = total >= 10 && done / total >= 0.9;

  return { ready: nearDeadline || mostlyDone, pending };
}
