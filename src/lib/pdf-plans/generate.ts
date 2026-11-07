import "server-only";
import { db } from "@/lib/db";
import { decomposeGoal } from "@/lib/ai/decompose";
import { expandIntoDays } from "@/lib/ai/expand";
import { recordUsage } from "@/lib/ai/usage";
import { parseIsoDate, splitRange, toIsoDate } from "@/lib/plan/calendar";
import { templateById } from "@/content/pdf-plans";
import { expandIntoWeeks } from "./weekly";
import { restFrequencyFor, workingDays } from "./rest-days";
import {
  isComplete,
  nextUnplannedPeriod,
  parsePlan,
  progress,
  type Granularity,
  type PlanPeriod,
  type StoredPlan,
} from "./plan";
import type { Locale } from "@/i18n/routing";

/**
 * Vyrobení zaplaceného plánu, po kolech.
 *
 * Jedno volání modelu na jeden požadavek, stejně jako rozpad cíle
 * v aplikaci. Důvod je tentýž: dlouhý plán je i třináct volání a
 * v jednom požadavku by běžel minuty — proxy by ho utnula dřív, než
 * by doběhl, a zákazník by koukal na chybu u něčeho zaplaceného.
 *
 * Po každém kole se mezivýsledek uloží. Když cokoliv selže, další
 * pokus naváže tam, kde se přestalo, a znovu se neplatí za to, co už
 * je hotové.
 *
 * ── Dvě podrobnosti ─────────────────────────────────────────────────
 *
 *  - `daily`  — nejvyšší úroveň jsou týdny, pak dny,
 *  - `weekly` — nejvyšší úroveň jsou měsíce, pak týdny.
 *
 * Obojí jsou dvě kola stejného tvaru, takže se liší jen tím, co se
 * ve druhém kole volá.
 *
 * ── Proč se tu nehlídá strop spotřeby ───────────────────────────────
 *
 * `assertWithinBudget` se volá při zakládání platby, ne tady. Odmítnout
 * zákazníka, který už zaplatil, protože nám došel měsíční rozpočet, je
 * to nejhorší, co se dá udělat — peníze jsou na účtu a protiplnění by
 * nepřišlo. Spotřeba se zapisuje, takže se to v přehledu objeví.
 */

export type RoundResult =
  | { ok: true; done: boolean; progress: { done: number; total: number } }
  | { ok: false; error: "notFound" | "notPaid" | "aiFailed" };

function asLocale(value: string): Locale {
  return (value === "cs" || value === "de" ? value : "en") as Locale;
}

type Order = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startingPoint: string | null;
  templateId: string | null;
  granularity: string;
  restDays: number[];
  locale: string;
  startDate: Date;
  targetDate: Date;
  hoursPerWeek: number;
};

/**
 * Jedno kolo: buď rozpad na období, nebo rozepsání nejbližšího
 * období. Volající se ptá znovu, dokud nepřijde `done`.
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
      ? await fillPeriod(order as Order, stored, template?.guidance)
      : await planPeriods(order as Order, template?.guidance);

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

/** První kolo: rozpad na období — týdny, nebo měsíce. */
async function planPeriods(
  order: Order,
  guidance: string | undefined,
): Promise<StoredPlan> {
  const granularity = order.granularity as Granularity;
  const level = granularity === "weekly" ? "month" : "week";

  const { plan, usage, ranges } = await decomposeGoal({
    goal: order.title,
    context: order.description ?? undefined,
    startingPoint: order.startingPoint ?? undefined,
    guidance,
    targetDate: toIsoDate(order.targetDate),
    locale: asLocale(order.locale),
    today: toIsoDate(order.startDate),
    /*
     * Jednotka se vynucuje, nenechává se na odhadu. Ten počítá s tím,
     * že dlouhá cesta se ve dnech plánovat nedá — jenže tady o tom
     * rozhoduje šablona, ne délka: roční svatba se plánuje po
     * měsících a dvanáctitýdenní maturita po týdnech, i když obojí
     * leží za hranicí odhadu.
     */
    level,
    dailyCapacityMinutes: dailyMinutes(order.hoursPerWeek, order.restDays),
    restFrequency: restFrequencyFor(order.restDays),
    reflectionMinutesPerDay: 0,
  });

  await recordUsage({
    userId: order.userId,
    operation: "PDF_PLAN",
    usage,
    label: `plán v PDF ${order.id} — období`,
  });

  return {
    granularity,
    restatement: plan.goalRestated,
    assumptions: plan.assumptions,
    finalChallenge: plan.finalChallenge,
    feasibility: plan.feasibility,
    feasibilityNote: plan.feasibilityNote,
    periods: plan.periods.map((period, i) => ({
      index: i + 1,
      title: period.title,
      milestone: period.milestone,
      startDate: toIsoDate(ranges[i].startDate),
      endDate: toIsoDate(ranges[i].endDate),
      slots: [],
    })),
  };
}

/** Další kola: nejbližší nerozepsané období se rozepíše. */
async function fillPeriod(
  order: Order,
  plan: StoredPlan,
  guidance: string | undefined,
): Promise<StoredPlan> {
  const period = nextUnplannedPeriod(plan);
  if (!period) return plan;

  const start = parseIsoDate(period.startDate);
  const end = parseIsoDate(period.endDate);

  const filled: PlanPeriod =
    plan.granularity === "weekly"
      ? await fillWeekly(order, plan, period, start, end, guidance)
      : await fillDaily(order, plan, period, start, end);

  return {
    ...plan,
    periods: plan.periods.map((p) => (p.index === period.index ? filled : p)),
  };
}

/** Týden na dny. Volné dny se modelu vůbec nenabídnou. */
async function fillDaily(
  order: Order,
  plan: StoredPlan,
  period: PlanPeriod,
  start: Date,
  end: Date,
): Promise<PlanPeriod> {
  /*
   * Volné dny se nevyhazují až z odpovědi, ale ze zadání: model
   * dostane jen dny, na které se plánuje. Kdyby se mu nabídly
   * všechny a jen se mu řeklo, ať víkend vynechá, občas by ho tam
   * stejně napsal — a škrtnout den z hotové odpovědi znamená zahodit
   * práci, za kterou se zaplatilo.
   */
  const ranges = workingDays(splitRange(start, end, "DAY"), order.restDays);

  // Období bez jediného pracovního dne — třeba týden, který celý padl
  // na volno. Vyrobí se prázdné, ať se generování nezasekne.
  if (ranges.length === 0) {
    return { ...period, slots: [emptySlot(period)] };
  }

  const { days, usage } = await expandIntoDays({
    goal: {
      title: order.title,
      targetDate: toIsoDate(order.targetDate),
      restatement: plan.restatement,
      finalChallenge: plan.finalChallenge,
      locale: asLocale(order.locale),
      dailyCapacityMinutes: dailyMinutes(order.hoursPerWeek, order.restDays),
      restFrequency: restFrequencyFor(order.restDays),
      reflectionMinutesPerDay: 0,
    },
    parent: {
      unit: "WEEK",
      title: period.title,
      summary: period.milestone,
      range: { startDate: start, endDate: end },
    },
    ranges,
  });

  await recordUsage({
    userId: order.userId,
    operation: "PDF_PLAN",
    usage,
    label: `plán v PDF ${order.id} — období ${period.index}`,
  });

  return {
    ...period,
    slots: days.slice(0, ranges.length).map((day, i) => ({
      startDate: toIsoDate(ranges[i].startDate),
      endDate: toIsoDate(ranges[i].endDate),
      summary: day.summary,
      tasks: day.tasks.map((task) => ({
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
      })),
    })),
  };
}

/** Měsíc na týdny. Volné dny tu nehrají roli — den si volí člověk. */
async function fillWeekly(
  order: Order,
  plan: StoredPlan,
  period: PlanPeriod,
  start: Date,
  end: Date,
  guidance: string | undefined,
): Promise<PlanPeriod> {
  const ranges = splitRange(start, end, "WEEK");

  const { weeks, usage } = await expandIntoWeeks({
    goal: order.title,
    locale: asLocale(order.locale),
    restatement: plan.restatement,
    finalChallenge: plan.finalChallenge,
    guidance,
    period: {
      title: period.title,
      milestone: period.milestone,
      startDate: start,
      endDate: end,
    },
    ranges,
    hoursPerWeek: order.hoursPerWeek,
  });

  await recordUsage({
    userId: order.userId,
    operation: "PDF_PLAN",
    usage,
    label: `plán v PDF ${order.id} — období ${period.index}`,
  });

  return {
    ...period,
    slots: weeks.slice(0, ranges.length).map((week, i) => ({
      startDate: toIsoDate(ranges[i].startDate),
      endDate: toIsoDate(ranges[i].endDate),
      summary: week.summary,
      tasks: week.tasks,
    })),
  };
}

/** Zástupný oddíl u období, na které nezbyl pracovní den. */
function emptySlot(period: PlanPeriod) {
  return {
    startDate: period.startDate,
    endDate: period.endDate,
    summary: "",
    tasks: [],
  };
}

/**
 * Z týdenních hodin denní minuty.
 *
 * Dělí se počtem pracovních dní, ne sedmi: kapacita se má rozložit do
 * dnů, na které se opravdu plánuje. Při dělení sedmi by každý den
 * vyšel kratší a týdenní objem by nevyšel — tím víc, čím víc má
 * člověk volna.
 */
function dailyMinutes(hoursPerWeek: number, restDays: number[]): number {
  const working = Math.max(1, 7 - restDays.length);
  return Math.max(15, Math.round((hoursPerWeek * 60) / working));
}
