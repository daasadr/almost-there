import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { estimateCostHellers, formatUsage } from "./cost";
import type { AiUsage } from "./call";
import type { AiOperation } from "@/generated/prisma";

/**
 * Evidence spotřeby AI a měsíční strop na uživatele (zadání, bod 9).
 *
 * Bez stropu stačí jeden účet, který si založí cíle a nechá je pořád
 * přeplánovávat, aby prožral víc, než kolik zaplatil. Předplatné je
 * paušál, náklady na model nejsou — to se musí někde potkat.
 *
 * Strop je měsíční a počítá se podle kalendářního měsíce, tedy stejně,
 * jako se platí předplatné.
 */

export class AiBudgetError extends Error {
  readonly name = "AiBudgetError";
  constructor(readonly spentHellers: number) {
    super("Měsíční strop spotřeby AI je vyčerpaný.");
  }
}

function startOfMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Kolik uživatel letos v tomhle měsíci protočil, v haléřích. */
export async function monthlySpendHellers(userId: string): Promise<number> {
  const result = await db.aiUsageEvent.aggregate({
    where: { userId, createdAt: { gte: startOfMonth() } },
    _sum: { costHellers: true },
  });
  return result._sum.costHellers ?? 0;
}

export class PlanAllowanceError extends Error {
  readonly name = "PlanAllowanceError";
}

export type PlanAllowance = {
  used: number;
  allowed: number;
  /** Kolik z limitu je spotřebováno, 0–100. Tohle uživatel vidí. */
  percent: number;
  remaining: number;
  exhausted: boolean;
};

/**
 * Měsíční limit nových plánů — to, co zákazník zná z ceníku.
 *
 * Počítá se ze záznamů o spotřebě, ne z počtu cílů v databázi. Cíle se
 * mažou natvrdo, takže podle nich by se limit obcházel zakládáním
 * a mazáním dokola. Záznam o volání modelu zůstane i po smazání cíle —
 * peníze jsme utratili tak jako tak.
 */
export async function getPlanAllowance(
  userId: string,
): Promise<PlanAllowance> {
  const used = await db.aiUsageEvent.count({
    where: {
      userId,
      operation: "DECOMPOSE_GOAL",
      createdAt: { gte: startOfMonth() },
    },
  });

  const allowed = env.monthlyPlanAllowance;

  return {
    used,
    allowed,
    percent: Math.min(100, Math.round((used / allowed) * 100)),
    remaining: Math.max(0, allowed - used),
    exhausted: used >= allowed,
  };
}

export type BudgetState = {
  spentHellers: number;
  capHellers: number;
  /** Zbývá do stropu; nikdy záporné. */
  remainingHellers: number;
  /** Kolik ze stropu je vyčerpáno, 0–100. */
  percent: number;
  /** Přes strop — další generování se nespustí. */
  exhausted: boolean;
  /** Blíží se ke stropu; ukazujeme varování, ale generujeme dál. */
  warning: boolean;
};

export async function getBudget(userId: string): Promise<BudgetState> {
  const spentHellers = await monthlySpendHellers(userId);
  const capHellers = env.aiMonthlyCapCzk * 100;
  const warnHellers = env.aiMonthlyWarnCzk * 100;

  return {
    spentHellers,
    capHellers,
    remainingHellers: Math.max(0, capHellers - spentHellers),
    percent: Math.min(100, Math.round((spentHellers / capHellers) * 100)),
    exhausted: spentHellers >= capHellers,
    warning: spentHellers >= warnHellers,
  };
}

/**
 * Kontrola před generováním.
 *
 * Záměrně se ptá předem, ne až podle výsledku — cenu volání dopředu neznáme
 * a nechceme ji zjistit tím, že ji zaplatíme. Uživatel tak může strop
 * o jedno volání přestřelit, což je přijatelné: jedno volání stojí koruny.
 */
export async function assertWithinBudget(userId: string): Promise<void> {
  const budget = await getBudget(userId);
  if (budget.exhausted) throw new AiBudgetError(budget.spentHellers);
}

/**
 * Zápis spotřeby. Volá se po každém volání modelu.
 *
 * Selhání zápisu nesmí shodit už hotové generování — uživatel by přišel
 * o plán kvůli účetnictví. Proto jen zalogujeme.
 */
export async function recordUsage({
  userId,
  operation,
  usage,
  label,
}: {
  userId: string | null;
  operation: AiOperation;
  usage: AiUsage;
  label: string;
}): Promise<number> {
  const costHellers = estimateCostHellers(usage);
  console.log(formatUsage(label, usage));

  try {
    await db.aiUsageEvent.create({
      data: {
        userId,
        operation,
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        costHellers,
      },
    });
  } catch (error) {
    console.error("[ai] spotřebu se nepodařilo zapsat", error);
  }

  return costHellers;
}
