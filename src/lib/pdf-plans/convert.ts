import "server-only";
import { db } from "@/lib/db";
import { parseIsoDate } from "@/lib/plan/calendar";
import { isComplete, parsePlan, type StoredPlan } from "./plan";
import type { BlockLevel } from "@/generated/prisma";

/**
 * Z koupeného plánu udělá skutečný cíl v aplikaci.
 *
 * **Model se nevolá.** Plán už existuje — leží uložený od chvíle, kdy
 * se vyrobil. Kdyby se generoval znovu, vyšel by jinak než ten, co má
 * člověk vytištěný na zdi, a ta nesrovnalost je horší než žádný
 * převod: komu se rozejde papír s obrazovkou, přestane věřit oběma.
 *
 * Tím pádem je to levné a rychlé — jeden zápis do databáze.
 *
 * ── Období a oddíly na bloky ────────────────────────────────────────
 *
 * Uložený plán má dvě úrovně a aplikace taky. U podrobného plánu je
 * období týden a oddíl den, u týdenního měsíc a týden; mapuje se to
 * jedna ku jedné, jen se liší `level`.
 *
 * Úkoly dostanou typ `ACTION`. Odpočinek ani reflexi jednorázový plán
 * nerozlišuje, takže hádat by znamenalo vymýšlet si.
 */

export class AlreadyConvertedError extends Error {
  readonly name = "AlreadyConvertedError";
}

export class PlanNotReadyError extends Error {
  readonly name = "PlanNotReadyError";
}

/**
 * Převede plán a vrátí id nového cíle.
 *
 * Když už cíl jednou vznikl, vrátí chybu místo druhého cíle. Dvojí
 * klepnutí nebo dvě otevřené záložky jsou běžná věc a dva stejné cíle
 * by se pak musely ručně mazat.
 */
export async function convertToGoal(
  pdfPlanId: string,
  userId: string,
): Promise<string> {
  const order = await db.pdfPlan.findFirst({
    where: { id: pdfPlanId, userId },
    select: {
      id: true,
      title: true,
      description: true,
      locale: true,
      goalId: true,
      status: true,
      planJson: true,
      targetDate: true,
    },
  });

  if (!order) throw new PlanNotReadyError("Plán neexistuje.");
  if (order.goalId) throw new AlreadyConvertedError("Cíl už z plánu vznikl.");

  const plan = parsePlan(order.planJson);
  if (!plan || !isComplete(plan)) {
    throw new PlanNotReadyError("Plán ještě není hotový.");
  }

  const level: BlockLevel = plan.granularity === "weekly" ? "MONTH" : "WEEK";
  const childLevel: BlockLevel = plan.granularity === "weekly" ? "WEEK" : "DAY";

  return db.$transaction(async (tx) => {
    const goal = await tx.goal.create({
      data: {
        userId,
        title: order.title,
        description: order.description,
        targetDate: order.targetDate,
        locale: order.locale,
        restatement: plan.restatement,
        assumptions: plan.assumptions,
        feasibility: plan.feasibility,
        feasibilityNote: plan.feasibilityNote,
        ...(plan.finalChallenge ? { finalChallenge: plan.finalChallenge } : {}),
      },
      select: { id: true },
    });

    /*
     * Zápisy jdou po sobě, ne přes Promise.all: paralelní zápisy uvnitř
     * jedné transakce si umí navzájem zamknout řádky a celé to zatuhne.
     * Stejný důvod jako v planner.ts.
     */
    for (const period of plan.periods) {
      const parent = await tx.timeBlock.create({
        data: {
          goalId: goal.id,
          level,
          startDate: parseIsoDate(period.startDate),
          endDate: parseIsoDate(period.endDate),
          title: period.title,
          summary: period.milestone,
          position: period.index,
        },
        select: { id: true },
      });

      for (const [i, slot] of period.slots.entries()) {
        await tx.timeBlock.create({
          data: {
            goalId: goal.id,
            parentBlockId: parent.id,
            level: childLevel,
            startDate: parseIsoDate(slot.startDate),
            endDate: parseIsoDate(slot.endDate),
            summary: slot.summary,
            position: i + 1,
            tasks: {
              create: slot.tasks.map((task, position) => ({
                goalId: goal.id,
                title: task.title,
                // Nula znamená „doba nedává smysl“ — u zařizování, kde
                // se hlavně čeká na někoho jiného. V databázi prázdno,
                // ať UI nepíše „0 min“.
                estimatedMinutes: task.estimatedMinutes || null,
                position: position + 1,
              })),
            },
          },
        });
      }
    }

    /*
     * Vazba se zapisuje až nakonec a je v téže transakci. Kdyby se
     * zápis cíle povedl a tohle ne, šel by plán převést znovu a vznikl
     * by druhý cíl — tedy právě to, čemu se tu předchází.
     */
    await tx.pdfPlan.update({
      where: { id: order.id },
      data: { goalId: goal.id },
    });

    return goal.id;
  });
}

/** Kolik toho z plánu vznikne. Pro text tlačítka, ať je vidět rozsah. */
export function convertSummary(plan: StoredPlan): {
  periods: number;
  tasks: number;
} {
  return {
    periods: plan.periods.length,
    tasks: plan.periods.reduce(
      (sum, period) =>
        sum + period.slots.reduce((inner, slot) => inner + slot.tasks.length, 0),
      0,
    ),
  };
}
