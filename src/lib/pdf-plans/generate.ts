import "server-only";
import { db } from "@/lib/db";
import { decomposeGoal } from "@/lib/ai/decompose";
import { expandIntoDays } from "@/lib/ai/expand";
import { recordUsage } from "@/lib/ai/usage";
import { parseIsoDate, splitRange, toIsoDate } from "@/lib/plan/calendar";
import { templateById } from "@/content/pdf-plans";
import {
  isComplete,
  nextUnplannedWeek,
  parsePlan,
  progress,
  type PlanWeek,
  type StoredPlan,
} from "./plan";
import type { Locale } from "@/i18n/routing";

/**
 * Vyrobení zaplaceného plánu, po kolech.
 *
 * Jedno volání modelu na jeden požadavek, stejně jako rozpad cíle
 * v aplikaci. Důvod je tentýž: dvanáctitýdenní plán je třináct volání
 * a v jednom požadavku by běžel minuty — proxy by ho utnula dřív, než
 * by doběhl, a zákazník by koukal na chybu u něčeho zaplaceného.
 *
 * Po každém kole se mezivýsledek uloží. Když cokoliv selže, další
 * pokus naváže tam, kde se přestalo, a znovu se neplatí za to, co už
 * je hotové.
 *
 * ── Proč se tu nehlídá strop spotřeby ───────────────────────────────
 *
 * `assertWithinBudget` se volá při zakládání platby, ne tady. Odmítnout
 * zákazníka, který už zaplatil, protože nám došel měsíční rozpočet, je
 * to nejhorší, co se dá udělat — peníze jsou na účtu a protiplnění by
 * nepřišlo. Spotřeba se zapisuje, takže se to v přehledu objeví.
 */

/** Jak hluboko se ještě zkouší, než se plán prohlásí za nepovedený. */
export const MAX_ROUNDS = 20;

export type RoundResult =
  | { ok: true; done: boolean; progress: { done: number; total: number } }
  | { ok: false; error: "notFound" | "notPaid" | "aiFailed" };

function asLocale(value: string): Locale {
  return (value === "cs" || value === "de" ? value : "en") as Locale;
}

/**
 * Jedno kolo: buď rozpad na týdny, nebo rozepsání nejbližšího týdne
 * na dny. Volající se ptá znovu, dokud nepřijde `done`.
 */
export async function runRound(
  pdfPlanId: string,
  userId: string,
): Promise<RoundResult> {
  const order = await db.pdfPlan.findFirst({
    where: { id: pdfPlanId, userId },
  });
  if (!order) return { ok: false, error: "notFound" };

  // Před zaplacením se negeneruje. Kdyby se dalo, stačilo by založit
  // objednávku a platbu nedokončit.
  if (order.status === "AWAITING_PAYMENT") return { ok: false, error: "notPaid" };

  const stored = parsePlan(order.planJson);
  if (stored && isComplete(stored)) {
    return { ok: true, done: true, progress: progress(stored) };
  }

  const template = order.templateId ? templateById(order.templateId) : undefined;

  try {
    const plan = stored
      ? await planDays(order, stored, template?.guidance)
      : await planWeeks(order, template?.guidance);

    const done = isComplete(plan);

    await db.pdfPlan.update({
      where: { id: order.id },
      data: {
        planJson: JSON.stringify(plan),
        status: done ? "READY" : "GENERATING",
        ...(done ? { generatedAt: new Date() } : {}),
      },
    });

    return { ok: true, done, progress: progress(plan) };
  } catch (error) {
    console.error("[pdf-plans] kolo selhalo", order.id, error);
    return { ok: false, error: "aiFailed" };
  }
}

/** První kolo: rozpad na týdny. */
async function planWeeks(
  order: {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    startingPoint: string | null;
    locale: string;
    startDate: Date;
    targetDate: Date;
    hoursPerWeek: number;
  },
  guidance: string | undefined,
): Promise<StoredPlan> {
  const today = toIsoDate(order.startDate);

  const { plan, usage, ranges } = await decomposeGoal({
    goal: order.title,
    context: order.description ?? undefined,
    startingPoint: order.startingPoint ?? undefined,
    guidance,
    targetDate: toIsoDate(order.targetDate),
    locale: asLocale(order.locale),
    today,
    // Vždycky týdny. Dvanáctitýdenní cíl by odhad rozpadl na měsíce,
    // jenže tady se prodává právě rozpis po dnech.
    level: "week",
    dailyCapacityMinutes: dailyMinutes(order.hoursPerWeek),
    restFrequency: "one full rest day per week",
    reflectionMinutesPerDay: 0,
  });

  await recordUsage({
    userId: order.userId,
    operation: "PDF_PLAN",
    usage,
    label: `plán v PDF ${order.id} — týdny`,
  });

  return {
    restatement: plan.goalRestated,
    assumptions: plan.assumptions,
    finalChallenge: plan.finalChallenge,
    feasibility: plan.feasibility,
    feasibilityNote: plan.feasibilityNote,
    weeks: plan.periods.map((period, i) => ({
      index: i + 1,
      title: period.title,
      milestone: period.milestone,
      startDate: toIsoDate(ranges[i].startDate),
      endDate: toIsoDate(ranges[i].endDate),
      days: [],
    })),
  };
}

/** Další kola: nejbližší týden bez dnů se rozepíše. */
async function planDays(
  order: {
    id: string;
    userId: string;
    title: string;
    locale: string;
    targetDate: Date;
    hoursPerWeek: number;
  },
  plan: StoredPlan,
  _guidance: string | undefined,
): Promise<StoredPlan> {
  const week = nextUnplannedWeek(plan);
  if (!week) return plan;

  const ranges = splitRange(
    parseIsoDate(week.startDate),
    parseIsoDate(week.endDate),
    "DAY",
  );

  const { days, usage } = await expandIntoDays({
    goal: {
      title: order.title,
      targetDate: toIsoDate(order.targetDate),
      restatement: plan.restatement,
      finalChallenge: plan.finalChallenge,
      locale: asLocale(order.locale),
      dailyCapacityMinutes: dailyMinutes(order.hoursPerWeek),
      restFrequency: "one full rest day per week",
      reflectionMinutesPerDay: 0,
    },
    parent: {
      unit: "WEEK",
      title: week.title,
      summary: week.milestone,
      range: {
        startDate: parseIsoDate(week.startDate),
        endDate: parseIsoDate(week.endDate),
      },
    },
    ranges,
  });

  await recordUsage({
    userId: order.userId,
    operation: "PDF_PLAN",
    usage,
    label: `plán v PDF ${order.id} — týden ${week.index}`,
  });

  const filled: PlanWeek = {
    ...week,
    days: days.slice(0, ranges.length).map((day, i) => ({
      date: toIsoDate(ranges[i].startDate),
      summary: day.summary,
      tasks: day.tasks.map((task) => ({
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
      })),
    })),
  };

  return {
    ...plan,
    weeks: plan.weeks.map((w) => (w.index === week.index ? filled : w)),
  };
}

/**
 * Z týdenních hodin denní minuty.
 *
 * Dělí se šesti, ne sedmi: jeden den v týdnu je volno a kapacita se
 * má rozložit do zbylých. Při dělení sedmi by každý den vyšel o kus
 * kratší a týdenní objem by nevyšel.
 */
function dailyMinutes(hoursPerWeek: number): number {
  return Math.max(15, Math.round((hoursPerWeek * 60) / 6));
}
