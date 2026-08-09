import "server-only";
import { db } from "@/lib/db";
import { planSchema, type Plan } from "@/lib/ai/schemas";
import { planUnit } from "@/lib/ai/decompose";
import { weightForImportance } from "./planner";
import {
  parseIsoDate,
  splitRange,
  toIsoDate,
  todayIso,
  type DateRange,
} from "@/lib/plan/calendar";
import type { BlockLevel } from "@/generated/prisma";

/**
 * Převzetí cíle z dema do plné verze (zadání, bod 8).
 *
 * Rozfázování se nedělá znovu — je hotové a zaplacené z dema. Nutit
 * člověka, který právě zaplatil, aby zadal stejný cíl podruhé a čekal na
 * stejný výsledek, by bylo hloupé vůči němu i vůči nám.
 *
 * Proto se převzetí nezapočítává ani do měsíčního limitu plánů: žádné
 * volání modelu při něm neproběhne.
 *
 * Co v demu chybí — barva, důležitost a podrobnosti — doplní uživatel
 * při převzetí. Denní kapacita se bere z jeho nastavení; demo ji neznalo
 * a plán tedy vznikl s výchozí hodnotou. Řekneme mu to rovnou, ať ví,
 * na čem plán stojí, a může si ho případně nechat přeplánovat.
 */

export type ClaimableDemo = {
  id: string;
  title: string;
  targetDate: Date;
  level: string;
  periodCount: number;
};

export class DemoExpiredError extends Error {
  readonly name = "DemoExpiredError";
}

/** Načte demo cíl z odkazu v prohlížeči, pokud je ještě k převzetí. */
export async function findClaimableDemo(
  demoGoalId: string | undefined,
): Promise<ClaimableDemo | null> {
  if (!demoGoalId) return null;

  const demo = await db.demoGoal.findUnique({
    where: { id: demoGoalId },
    select: {
      id: true,
      title: true,
      targetDate: true,
      level: true,
      periods: true,
      claimedByGoalId: true,
      expiresAt: true,
    },
  });

  if (!demo || demo.claimedByGoalId) return null;
  if (demo.expiresAt.getTime() < Date.now()) return null;

  // Termín, který už uplynul nebo je za rohem, nemá cenu přebírat —
  // plán by neměl kam sáhnout.
  const minTarget = new Date(Date.now() + 14 * 86_400_000);
  if (demo.targetDate.getTime() < minTarget.getTime()) return null;

  const parsed = planSchema.safeParse(demo.periods);
  if (!parsed.success) return null;

  return {
    id: demo.id,
    title: demo.title,
    targetDate: demo.targetDate,
    level: demo.level,
    periodCount: parsed.data.periods.length,
  };
}

/**
 * Založí skutečný cíl z uloženého rozfázování.
 *
 * Období se přepočítají na dnešní datum: demo mohlo vzniknout před
 * týdnem a plán, který začíná v minulosti, by byl k ničemu. Milníky
 * zůstávají, posune se jen jejich umístění v čase.
 */
export async function claimDemoGoal({
  userId,
  demoGoalId,
  color,
  importance,
  description,
}: {
  userId: string;
  demoGoalId: string;
  color: string;
  importance: number;
  description?: string;
}): Promise<string> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { timezone: true },
  });

  const demo = await db.demoGoal.findUniqueOrThrow({
    where: { id: demoGoalId },
    select: {
      id: true,
      title: true,
      targetDate: true,
      locale: true,
      periods: true,
      claimedByGoalId: true,
      expiresAt: true,
    },
  });

  if (demo.claimedByGoalId) throw new DemoExpiredError("Už bylo převzato.");
  if (demo.expiresAt.getTime() < Date.now()) {
    throw new DemoExpiredError("Platnost vypršela.");
  }

  const parsed = planSchema.safeParse(demo.periods);
  if (!parsed.success) throw new DemoExpiredError("Uložený plán nelze přečíst.");

  const plan: Plan = parsed.data;
  const today = parseIsoDate(todayIso(user.timezone));
  const ranges = fit(
    splitRange(today, demo.targetDate, planUnit(plan.level)),
    plan.periods.length,
  );

  if (ranges.length === 0) throw new DemoExpiredError("Termín už uplynul.");

  const periods = plan.periods.slice(0, ranges.length);
  const level = planUnit(plan.level) as BlockLevel;

  const goal = await db.$transaction(async (tx) => {
    const created = await tx.goal.create({
      data: {
        userId,
        title: demo.title,
        description: description?.trim() || null,
        targetDate: demo.targetDate,
        locale: demo.locale,
        color,
        priorityWeight: weightForImportance(importance),
        restatement: plan.goalRestated,
        assumptions: plan.assumptions,
        feasibility: plan.feasibility,
        feasibilityNote: plan.feasibilityNote,
        timeBlocks: {
          create: periods.map((period, index) => ({
            level,
            startDate: ranges[index].startDate,
            endDate: ranges[index].endDate,
            title: period.title,
            summary: period.milestone,
            position: index + 1,
          })),
        },
      },
      select: { id: true },
    });

    // Označení proběhne ve stejné transakci — jinak by dvojí kliknutí
    // založilo dva stejné cíle.
    await tx.demoGoal.update({
      where: { id: demo.id },
      data: { claimedByGoalId: created.id },
    });

    return created;
  });

  console.log(
    `[demo] převzato do cíle ${goal.id} (${toIsoDate(today)} → ${toIsoDate(demo.targetDate)})`,
  );

  return goal.id;
}

/** Zkrátí rozsahy na počet období; poslední natáhne až k termínu. */
function fit(ranges: DateRange[], wanted: number): DateRange[] {
  if (ranges.length === 0 || wanted >= ranges.length) return ranges;

  const kept = ranges.slice(0, wanted);
  kept[wanted - 1] = {
    startDate: kept[wanted - 1].startDate,
    endDate: ranges[ranges.length - 1].endDate,
  };
  return kept;
}
