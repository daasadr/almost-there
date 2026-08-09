import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { callStructured } from "@/lib/ai/call";
import { recordUsage } from "@/lib/ai/usage";
import { env } from "@/lib/env";
import { localeAiNames, type Locale } from "@/i18n/routing";

/**
 * Milníky a odměny (zadání, bod 6).
 *
 * Milník je konec jedné etapy plánu — místo, kde je co ukázat. Odměna
 * u něj není ozdoba: dlouhý cíl nemá žádnou zpětnou vazbu měsíce dopředu
 * a bez menších zastávek se dojíždí jen na vůli, které dojde dřív než čas.
 *
 * Odměnu si člověk může napsat sám, nebo si nechat poradit. Návrh od AI
 * je návrh, ne přiřazení — přepsat ho jde kdykoliv.
 */

function asLocale(value: string): Locale {
  return (value === "cs" || value === "de" ? value : "en") as Locale;
}

/**
 * Založí milníky podle období nejvyšší úrovně.
 *
 * Volá se po vytvoření plánu i po přeplánování. Už dosažené milníky
 * zůstávají — jsou to zážitky, ne položky rozvrhu.
 */
export async function syncMilestones(goalId: string): Promise<void> {
  const blocks = await db.timeBlock.findMany({
    where: { goalId, parentBlockId: null },
    orderBy: { position: "asc" },
    select: { id: true, title: true, summary: true, endDate: true },
  });

  const existing = await db.milestone.findMany({
    where: { goalId },
    select: { id: true, timeBlockId: true, achievedAt: true },
  });

  const linked = new Set(
    existing.filter((m) => m.timeBlockId).map((m) => m.timeBlockId!),
  );

  // Milníky bez bloku a bez dosažení jsou pozůstatky po přeplánování —
  // jejich období už v plánu není a nemá je co naplnit.
  const orphaned = existing
    .filter((m) => !m.timeBlockId && !m.achievedAt)
    .map((m) => m.id);

  if (orphaned.length) {
    await db.milestone.deleteMany({ where: { id: { in: orphaned } } });
  }

  const missing = blocks.filter((block) => !linked.has(block.id));
  if (missing.length === 0) return;

  await db.milestone.createMany({
    data: missing.map((block) => ({
      goalId,
      timeBlockId: block.id,
      title: block.title ?? block.summary.slice(0, 80),
      targetDate: block.endDate,
    })),
  });
}

export type MilestoneRow = {
  id: string;
  title: string;
  targetDate: Date;
  rewardText: string | null;
  rewardSource: string | null;
  rewardClaimed: boolean;
  achievedAt: Date | null;
  summary: string | null;
};

export async function listMilestones(goalId: string): Promise<MilestoneRow[]> {
  const rows = await db.milestone.findMany({
    where: { goalId },
    orderBy: { targetDate: "asc" },
    select: {
      id: true,
      title: true,
      targetDate: true,
      rewardText: true,
      rewardSource: true,
      rewardClaimed: true,
      achievedAt: true,
      timeBlock: { select: { summary: true } },
    },
  });

  return rows.map(({ timeBlock, ...row }) => ({
    ...row,
    summary: timeBlock?.summary ?? null,
  }));
}

/** Milníky, jejichž datum uplynulo a uživatel je ještě nepotvrdil. */
export async function getReachedMilestones(userId: string) {
  return db.milestone.findMany({
    where: {
      goal: { userId, status: "ACTIVE" },
      achievedAt: null,
      targetDate: { lte: new Date() },
    },
    orderBy: { targetDate: "asc" },
    take: 3,
    select: {
      id: true,
      title: true,
      rewardText: true,
      goal: { select: { id: true, title: true, color: true } },
      timeBlock: { select: { summary: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// Návrhy odměn
// ---------------------------------------------------------------------------

const suggestionsSchema = z.object({
  rewards: z.array(
    z.object({
      index: z.number().int(),
      reward: z.string().min(1),
    }),
  ),
});

const SYSTEM = `You suggest small rewards a person gives themselves for reaching a stage of a long goal.

A long goal has no feedback for weeks. Without smaller stops along the way it runs on willpower alone, and willpower runs out before the time does. The reward is what makes a stage worth reaching.

Rules for every suggestion:

- Keep it proportionate to the stage. An early stage is worth an evening off, not a holiday.
- Prefer things that cost little or nothing: an afternoon with a book, a long bath, a walk somewhere new, a film they have been putting off, dinner cooked properly instead of quickly.
- Never suggest anything that undermines the goal itself. No drink for someone stopping drinking, no day of screens for someone getting off their phone.
- Make it concrete enough to picture. "Something nice" is not a reward.
- One sentence each, at most fifteen words. No exclamation marks.
- Do not repeat the same reward twice in the list.

Write in the language you are told to use.`;

/** Návrhy odměn pro milníky, které zatím žádnou nemají. */
export async function suggestRewards(goalId: string): Promise<number> {
  const goal = await db.goal.findUniqueOrThrow({
    where: { id: goalId },
    select: { id: true, userId: true, title: true, locale: true },
  });

  const pending = await db.milestone.findMany({
    where: { goalId, rewardText: null },
    orderBy: { targetDate: "asc" },
    select: { id: true, title: true, timeBlock: { select: { summary: true } } },
  });
  if (pending.length === 0) return 0;

  const lines = [
    `Goal: ${goal.title}`,
    `Write in: ${localeAiNames[asLocale(goal.locale)]}`,
    "",
    `Suggest one reward for each of these ${pending.length} stages, in order:`,
    ...pending.map(
      (milestone, i) =>
        `  ${i + 1}. ${milestone.title}${
          milestone.timeBlock ? ` — ${milestone.timeBlock.summary}` : ""
        }`,
    ),
  ];

  const { data, usage } = await callStructured({
    system: SYSTEM,
    user: lines.join("\n"),
    jsonSchema: {
      type: "object",
      properties: {
        rewards: {
          type: "array",
          description: `Exactly ${pending.length} rewards, in the same order as the stages.`,
          items: {
            type: "object",
            properties: {
              index: {
                type: "integer",
                description: "1-based position of the stage.",
              },
              reward: {
                type: "string",
                description:
                  "One concrete, proportionate reward. At most fifteen words.",
              },
            },
            required: ["index", "reward"],
            additionalProperties: false,
          },
        },
      },
      required: ["rewards"],
      additionalProperties: false,
    },
    parser: suggestionsSchema,
    maxTokens: 4000,
    model: env.aiBlocksModel,
    effort: "low",
  });

  await recordUsage({
    userId: goal.userId,
    operation: "REWARD_SUGGESTION",
    usage,
    label: `odměny pro ${pending.length} milníků`,
  });

  // Podle pořadí v poli, ne podle `index` z odpovědi — model ho občas
  // přeskočí a přiřazení odměny k cizí etapě by bylo horší než žádná.
  const assignments = data.rewards.slice(0, pending.length);

  await db.$transaction(
    assignments.map((entry, i) =>
      db.milestone.update({
        where: { id: pending[i].id },
        data: { rewardText: entry.reward, rewardSource: "AI_SUGGESTED" },
      }),
    ),
  );

  return assignments.length;
}
