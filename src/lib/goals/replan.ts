import "server-only";
import { db } from "@/lib/db";
import { decomposeGoal, planUnit } from "@/lib/ai/decompose";
import { AiFormatError } from "@/lib/ai/call";
import { assertWithinBudget, recordUsage } from "@/lib/ai/usage";
import { parseIsoDate, toIsoDate, todayIso } from "@/lib/plan/calendar";
import { estimateNewTarget, getPaceStatus } from "./pace";
import { syncMilestones } from "./milestones";
import type { BlockLevel } from "@/generated/prisma";
import type { Locale } from "@/i18n/routing";

/**
 * Přeplánování cíle, který nabral skluz (zadání, bod 6 — adaptivní část).
 *
 * Dvě cesty: dohnat skluz ve stejném termínu, nebo posunout termín podle
 * tempa, kterým to reálně jde. V obou případech se zbytek plánu vytvoří
 * znovu od dneška.
 *
 * Nedodělané úkoly se nepřenášejí. Zůstanou v minulosti jako záznam toho,
 * co se nestihlo, a nový plán z nich vezme jen to, co ještě dává smysl —
 * viz instrukce v promptu. Přesouvat propadlé úkoly dopředu je nejrychlejší
 * způsob, jak z plánu udělat kupku, kterou nikdo neotevře.
 *
 * Do měsíčního limitu nových plánů se přeplánování nepočítá. Podmínky
 * slibují, že práce s už založeným cílem je bez omezení, a tohle je přesně
 * ona. Tichý strop v korunách platí dál.
 */

export type ReplanMode = "catchUp" | "moveDeadline";

export class ReplanTooSoonError extends Error {
  readonly name = "ReplanTooSoonError";
}

/** Jak dlouho po přeplánování další nepovolit. */
const COOLDOWN_HOURS = 24;

const REST_WORDS: Record<string, string> = {
  NONE: "no fixed rest days",
  ONE_DAY_PER_WEEK: "one full rest day per week",
  TWO_DAYS_PER_WEEK: "two full rest days per week",
  EVERY_OTHER_DAY: "every other day is a rest day",
};

function asLocale(value: string): Locale {
  return (value === "cs" || value === "de" ? value : "en") as Locale;
}

export async function replanGoal({
  goalId,
  mode,
}: {
  goalId: string;
  mode: ReplanMode;
}): Promise<{ newTargetDate: Date }> {
  const goal = await db.goal.findUniqueOrThrow({
    where: { id: goalId },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      startingPoint: true,
      targetDate: true,
      locale: true,
      restatement: true,
      user: {
        select: {
          timezone: true,
          dailyCapacityMinutes: true,
          restFrequency: true,
          reflectionMinutesDay: true,
        },
      },
    },
  });

  const recent = await db.replanEvent.findFirst({
    where: {
      goalId,
      reason: { not: "USER_DECLINED_REPLAN" },
      triggeredAt: { gte: new Date(Date.now() - COOLDOWN_HOURS * 3_600_000) },
    },
    select: { id: true },
  });
  if (recent) {
    throw new ReplanTooSoonError("Cíl byl přeplánován před chvílí.");
  }

  await assertWithinBudget(goal.userId);

  const timezone = goal.user.timezone;
  const todayStr = todayIso(timezone);
  const today = parseIsoDate(todayStr);

  const pace = await getPaceStatus(goalId, timezone);
  const completionRate = pace?.completionRate ?? 1;
  const missedDays = pace?.missedDays ?? 0;

  const newTargetDate =
    mode === "moveDeadline"
      ? estimateNewTarget(today, goal.targetDate, completionRate)
      : goal.targetDate;

  // Milníky období, která už začala — vstup pro model, ať ví, odkud
  // navazuje. Patří sem i období právě běžící: jeho první část je taky
  // za námi a částečně splněná.
  const pastBlocks = await db.timeBlock.findMany({
    where: { goalId, parentBlockId: null, startDate: { lt: today } },
    orderBy: { startDate: "asc" },
    select: { summary: true },
  });

  const { plan, usage, ranges } = await decomposeGoal({
    goal: goal.title,
    // Bez těchhle dvou by přeplánovaný cíl vyšel obecnější než původní.
    context: goal.description ?? undefined,
    startingPoint: goal.startingPoint ?? undefined,
    targetDate: toIsoDate(newTargetDate),
    locale: asLocale(goal.locale),
    today: todayStr,
    dailyCapacityMinutes: goal.user.dailyCapacityMinutes,
    restFrequency: REST_WORDS[goal.user.restFrequency],
    reflectionMinutesPerDay: goal.user.reflectionMinutesDay,
    replan: {
      pastMilestones: pastBlocks.map((block) => block.summary),
      completionRate,
      missedDays,
      deadlineMoved: mode === "moveDeadline",
    },
  }).catch(async (error) => {
    if (error instanceof AiFormatError && error.usage) {
      await recordUsage({
        userId: goal.userId,
        operation: "REPLAN",
        usage: error.usage,
        label: `přeplánování ${goal.id} — NEÚSPĚCH`,
      });
    }
    throw error;
  });

  await recordUsage({
    userId: goal.userId,
    operation: "REPLAN",
    usage,
    label: `přeplánování ${mode} období=${plan.periods.length}`,
  });

  const level = planUnit(plan.level) as BlockLevel;

  const yesterday = new Date(today.getTime() - 86_400_000);

  await db.$transaction(async (tx) => {
    // Odejde všechno od dneška dál, na kterékoliv úrovni. Kaskáda ve
    // schématu vezme s bloky i jejich úkoly.
    await tx.timeBlock.deleteMany({
      where: { goalId, startDate: { gte: today } },
    });

    // Období, které dneškem teprve prochází, se nemaže, jen zkrátí ke
    // včerejšku. Kdyby zmizelo celé, přišli bychom s ním o odškrtané dny
    // z jeho první poloviny — a právě podle nich se počítá, jak rychle
    // to člověku jde. Bez té historie by příští vyhodnocení tempa začínalo
    // od nuly a vyšlo by nesmyslně optimisticky.
    await tx.timeBlock.updateMany({
      where: { goalId, endDate: { gte: today } },
      data: { endDate: yesterday },
    });

    await tx.goal.update({
      where: { id: goalId },
      data: {
        targetDate: newTargetDate,
        restatement: plan.goalRestated,
        assumptions: plan.assumptions,
        feasibility: plan.feasibility,
        feasibilityNote: plan.feasibilityNote,
        timeBlocks: {
          create: plan.periods.map((period, i) => ({
            level,
            startDate: ranges[i].startDate,
            endDate: ranges[i].endDate,
            title: period.title,
            summary: period.milestone,
            position: i + 1,
          })),
        },
      },
    });

    await tx.replanEvent.create({
      data: {
        goalId,
        reason: "BEHIND_SCHEDULE",
        // SCHEDULE_ONLY = termín zůstává, mění se rozvržení.
        // FULL_REDECOMPOSITION = posunul se i termín.
        scope: mode === "catchUp" ? "SCHEDULE_ONLY" : "FULL_REDECOMPOSITION",
        oldTargetDate: goal.targetDate,
        newTargetDate,
        completionRate,
        aiSummary: plan.feasibilityNote,
      },
    });
  });

  // Nová období, nové milníky. Dosažené zůstávají — jsou to zážitky,
  // ne položky rozvrhu.
  await syncMilestones(goalId);

  return { newTargetDate };
}

/** Uživatel nabídku odmítl. Zapíšeme to, ať se neptáme hned zítra znovu. */
export async function declineReplan(goalId: string): Promise<void> {
  await db.replanEvent.create({
    data: { goalId, reason: "USER_DECLINED_REPLAN", scope: "NONE" },
  });
}
