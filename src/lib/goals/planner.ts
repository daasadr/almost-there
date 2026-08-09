import "server-only";
import { db } from "@/lib/db";
import { decomposeGoal, planUnit } from "@/lib/ai/decompose";
import { expandIntoBlocks, expandIntoDays, type GoalContext } from "@/lib/ai/expand";
import {
  assertWithinBudget,
  getPlanAllowance,
  PlanAllowanceError,
  recordUsage,
} from "@/lib/ai/usage";
import {
  childUnit,
  parseIsoDate,
  splitRange,
  toIsoDate,
  todayIso,
  type DateRange,
  type Unit,
} from "@/lib/plan/calendar";
import type { Locale } from "@/i18n/routing";
import { AiFormatError } from "@/lib/ai/call";
import { syncMilestones } from "./milestones";
import type { AiOperation, BlockLevel, Prisma } from "@/generated/prisma";

/**
 * Založení cíle a průběžné dorozpadávání plánu.
 *
 * Klíčové rozhodnutí: při založení se generuje jen nejvyšší úroveň. Nižší
 * se dopočítávají teprve tehdy, když se k nim uživatel přiblíží. Rozepsat
 * desetiletý cíl rovnou na dny by trvalo hodiny, stálo majlant a stejně by
 * to bylo k ničemu — plán se do té doby mnohokrát změní.
 */

type UserPrefs = {
  id: string;
  locale: string;
  timezone: string;
  dailyCapacityMinutes: number;
  restFrequency: string;
  reflectionMinutesDay: number;
};

/** Slovní popis pro prompt. Model rozumí líp větě než enumu. */
const REST_WORDS: Record<string, string> = {
  NONE: "no fixed rest days",
  ONE_DAY_PER_WEEK: "one full rest day per week",
  TWO_DAYS_PER_WEEK: "two full rest days per week",
  EVERY_OTHER_DAY: "every other day is a rest day",
};

function asLocale(value: string): Locale {
  return (value === "cs" || value === "de" ? value : "en") as Locale;
}

/**
 * Důležitost cíle na stupnici 1–5 převedená na váhu.
 *
 * Podle vah se dělí denní kapacita mezi běžící cíle. Rozestupy jsou
 * schválně nerovnoměrné: rozdíl mezi „hlavní věc, kterou teď řeším“
 * a „něco, k čemu se dostanu“ má být znát mnohem víc než rozdíl mezi
 * dvěma prostředními stupni.
 */
const IMPORTANCE_WEIGHTS = [20, 35, 50, 75, 110] as const;

export function weightForImportance(importance: number): number {
  const index = Math.min(5, Math.max(1, Math.round(importance))) - 1;
  return IMPORTANCE_WEIGHTS[index];
}

/**
 * Zaúčtuje spotřebu i u volání, které skončilo chybou.
 *
 * Tokeny se platí za každou odpověď, i za tu zahozenou. Kdyby se
 * zapisovaly jen úspěchy, strop by neviděl právě ten případ, proti
 * kterému má chránit — volání, které selhává dokola.
 */
async function accountFailure(
  userId: string,
  operation: AiOperation,
  label: string,
  error: unknown,
): Promise<void> {
  if (!(error instanceof AiFormatError) || !error.usage) return;

  await recordUsage({
    userId,
    operation,
    usage: error.usage,
    label: `${label} — NEÚSPĚCH`,
  });
}

function goalContext(
  user: UserPrefs,
  goal: {
    title: string;
    targetDate: Date;
    restatement: string | null;
    locale: string;
  },
  minutesForThisGoal: number,
): GoalContext {
  return {
    title: goal.title,
    targetDate: toIsoDate(goal.targetDate),
    restatement: goal.restatement,
    // Z cíle, ne z uživatele — plán nesmí v půlce změnit jazyk.
    locale: asLocale(goal.locale),
    dailyCapacityMinutes: minutesForThisGoal,
    restFrequency: REST_WORDS[user.restFrequency] ?? REST_WORDS.ONE_DAY_PER_WEEK,
    reflectionMinutesPerDay: user.reflectionMinutesDay,
  };
}

// ---------------------------------------------------------------------------
// Založení cíle
// ---------------------------------------------------------------------------

export async function createGoalWithPlan({
  userId,
  title,
  description,
  targetDate,
  locale,
  importance = 3,
  color = "lime",
}: {
  userId: string;
  title: string;
  description?: string;
  targetDate: string;
  /** Jazyk stránky, ze které se cíl zakládá. V něm bude celý plán. */
  locale: Locale;
  /** Jak je cíl pro uživatele důležitý, 1–5. Řídí podíl na denní kapacitě. */
  importance?: number;
  /** Barva z palety, kterou je cíl označený napříč aplikací. */
  color?: string;
}): Promise<string> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      locale: true,
      timezone: true,
      dailyCapacityMinutes: true,
      restFrequency: true,
      reflectionMinutesDay: true,
    },
  });

  // Dvě různé pojistky: limit plánů zná zákazník z ceníku, strop v korunách
  // je tichá ochrana proti zneužití. Poctivé použití narazí jen na ten první.
  const allowance = await getPlanAllowance(userId);
  if (allowance.exhausted) {
    throw new PlanAllowanceError("Měsíční limit nových plánů je vyčerpaný.");
  }
  await assertWithinBudget(userId);

  // Ostatní běžící cíle jdou do promptu, aby si AI nenaplánovala náročné
  // období na stejnou dobu jako už existující cíl (zadání, bod 7).
  const others = await db.goal.findMany({
    where: { userId, status: "ACTIVE" },
    select: { title: true, targetDate: true },
    orderBy: { targetDate: "asc" },
    take: 10,
  });

  const today = todayIso(user.timezone);

  const decomposed = await decomposeGoal({
    goal: title,
    // Popis od uživatele patří modelu, ne jen do databáze. Bez něj plánuje
    // podle názvu cíle a všechno ostatní si domýšlí.
    context: description,
    targetDate,
    locale,
    today,
    dailyCapacityMinutes: user.dailyCapacityMinutes,
    restFrequency: REST_WORDS[user.restFrequency],
    reflectionMinutesPerDay: user.reflectionMinutesDay,
    otherActiveGoals: others.map((goal) => ({
      title: goal.title,
      targetDate: toIsoDate(goal.targetDate),
    })),
  }).catch(async (error) => {
    await accountFailure(userId, "DECOMPOSE_GOAL", `cíl „${title}“`, error);
    throw error;
  });

  const { plan, usage, ranges } = decomposed;

  // DECOMPOSE_GOAL, ne DECOMPOSE_MONTHLY: podle počtu těchhle záznamů se
  // počítá měsíční limit nových plánů, který zákazník zná z ceníku.
  await recordUsage({
    userId,
    operation: "DECOMPOSE_GOAL",
    usage,
    label: `cíl level=${plan.level} období=${plan.periods.length}`,
  });

  const level = planUnit(plan.level) as BlockLevel;

  const goal = await db.goal.create({
    data: {
      userId,
      title,
      description: description || null,
      targetDate: parseIsoDate(targetDate),
      locale,
      color,
      priorityWeight: weightForImportance(importance),
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
    select: { id: true },
  });

  // Milníky vycházejí z období nejvyšší úrovně — každá etapa je místo,
  // kde je co ukázat, a tedy i místo pro odměnu.
  await syncMilestones(goal.id);

  return goal.id;
}

// ---------------------------------------------------------------------------
// Průběžné dorozpadávání
// ---------------------------------------------------------------------------

type BlockRow = {
  id: string;
  level: BlockLevel;
  startDate: Date;
  endDate: Date;
  title: string | null;
  summary: string;
};

/**
 * Vybere blok, který se uživatele týká teď: ten, do kterého dnešek spadá,
 * jinak nejbližší budoucí. Když jsou všechny za námi, není co plánovat.
 */
function currentBlock(blocks: BlockRow[], today: Date): BlockRow | null {
  const containing = blocks.find(
    (block) => block.startDate <= today && today <= block.endDate,
  );
  if (containing) return containing;

  return blocks.find((block) => block.endDate >= today) ?? null;
}

/**
 * Kolik minut denně připadá na tenhle cíl.
 *
 * Kapacita se dělí mezi běžící cíle podle váhy. Bez toho by si každý cíl
 * naplánoval celý den a dohromady by z toho vyšlo něco, co se nedá stihnout
 * — přesně to, čemu má harmonizace zabránit (zadání, bod 7).
 */
async function minutesForGoal(
  userId: string,
  goalId: string,
  capacity: number,
): Promise<{ mine: number; others: number }> {
  const active = await db.goal.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, priorityWeight: true },
  });

  const totalWeight = active.reduce(
    (sum, goal) => sum + Math.max(1, goal.priorityWeight),
    0,
  );
  const mineWeight = Math.max(
    1,
    active.find((goal) => goal.id === goalId)?.priorityWeight ?? 50,
  );

  if (totalWeight <= 0) return { mine: capacity, others: 0 };

  const mine = Math.max(15, Math.round((capacity * mineWeight) / totalWeight));
  return { mine, others: Math.max(0, capacity - mine) };
}

export type PlanProgress = {
  /** Kolik volání AI se při dorozpadu provedlo. */
  calls: number;
  /** Nejnižší dosažená úroveň. */
  reached: BlockLevel | null;
  /** Hotovo — na dnešek už existují denní úkoly. Když ne, volej znovu. */
  done: boolean;
};

/**
 * Dorozpadá plán tak, aby na dnešek existovaly konkrétní úkoly.
 *
 * Postupuje shora dolů a na každé úrovni dogeneruje jen ten jeden blok,
 * do kterého dnešek spadá. Když už rozpad existuje, neudělá nic — je to
 * bezpečné volat při každém načtení stránky.
 *
 * `maxCalls` úmyslně omezuje jeden požadavek na jedno volání modelu.
 * U ročního cíle by se jinak zřetězily tři (měsíce → týdny → dny) a
 * požadavek by běžel i přes tři minuty — to už spolehlivě utne proxy
 * nebo netrpělivý uživatel. Klient místo toho zavolá endpoint víckrát.
 */
export async function ensureCurrentPlan(
  goalId: string,
  { maxCalls = 1 }: { maxCalls?: number } = {},
): Promise<PlanProgress> {
  const goal = await db.goal.findUniqueOrThrow({
    where: { id: goalId },
    select: {
      id: true,
      userId: true,
      title: true,
      targetDate: true,
      restatement: true,
      locale: true,
      status: true,
      user: {
        select: {
          id: true,
          locale: true,
          timezone: true,
          dailyCapacityMinutes: true,
          restFrequency: true,
          reflectionMinutesDay: true,
        },
      },
    },
  });

  const progress: PlanProgress = { calls: 0, reached: null, done: true };
  if (goal.status !== "ACTIVE") return progress;

  const today = parseIsoDate(todayIso(goal.user.timezone));
  const budget = await minutesForGoal(
    goal.userId,
    goal.id,
    goal.user.dailyCapacityMinutes,
  );
  const context = goalContext(goal.user, goal, budget.mine);

  // Nejvyšší úroveň vznikla při založení cíle.
  let siblings = await db.timeBlock.findMany({
    where: { goalId, parentBlockId: null },
    orderBy: { position: "asc" },
    select: blockSelect,
  });

  let block = currentBlock(siblings, today);

  while (block) {
    progress.reached = block.level;

    const nextUnit = childUnit(block.level as Unit);
    if (!nextUnit) break;

    let children = await db.timeBlock.findMany({
      where: { parentBlockId: block.id },
      orderBy: { position: "asc" },
      select: blockSelect,
    });

    if (children.length === 0) {
      // Došel limit volání na tenhle požadavek. Plán zůstane rozdělaný
      // a klient si řekne znovu — proto `done: false`.
      if (progress.calls >= maxCalls) {
        progress.done = false;
        break;
      }

      await assertWithinBudget(goal.userId);

      const ranges = splitRange(block.startDate, block.endDate, nextUnit);
      if (ranges.length === 0) break;

      children = await generateChildren({
        goalId,
        userId: goal.userId,
        context,
        parent: block,
        parentSiblings: siblings,
        childUnit: nextUnit,
        ranges,
        otherGoalMinutes: budget.others,
      });
      progress.calls += 1;
    }

    siblings = children;
    block = currentBlock(children, today);
  }

  return progress;
}

const blockSelect = {
  id: true,
  level: true,
  startDate: true,
  endDate: true,
  title: true,
  summary: true,
} as const;

/** Vygeneruje a uloží podbloky jednoho bloku. U dnů rovnou i úkoly. */
async function generateChildren({
  goalId,
  userId,
  context,
  parent,
  parentSiblings,
  childUnit: unit,
  ranges,
  otherGoalMinutes,
}: {
  goalId: string;
  userId: string;
  context: GoalContext;
  parent: BlockRow;
  parentSiblings: BlockRow[];
  childUnit: Unit;
  ranges: DateRange[];
  otherGoalMinutes: number;
}): Promise<BlockRow[]> {
  const parentInput = {
    unit: parent.level as Unit,
    title: parent.title,
    summary: parent.summary,
    range: { startDate: parent.startDate, endDate: parent.endDate },
  };

  const label = `${unit.toLowerCase()} pod ${toIsoDate(parent.startDate)}`;

  if (unit === "DAY") {
    const { days, usage } = await expandIntoDays({
      goal: context,
      parent: parentInput,
      ranges,
      otherGoalMinutesPerDay: otherGoalMinutes,
    }).catch(async (error) => {
      await accountFailure(userId, "DECOMPOSE_DAILY", label, error);
      throw error;
    });

    await recordUsage({
      userId,
      operation: "DECOMPOSE_DAILY",
      usage,
      label: `dny týdne ${toIsoDate(parent.startDate)} počet=${days.length}`,
    });

    // Jedna transakce: buď vznikne celý týden, nebo nic. Půlka týdne
    // v databázi by se pak dogenerovat nedala — kontrola „má potomky?“
    // by ji považovala za hotovou.
    //
    // Zápisy jdou po sobě, ne přes Promise.all: paralelní zápisy uvnitř
    // jedné transakce si umí navzájem zamknout řádky a celé to zatuhne.
    return db.$transaction(async (tx) => {
      const created: BlockRow[] = [];

      for (const [i, day] of days.entries()) {
        created.push(
          await tx.timeBlock.create({
            data: {
              goalId,
              parentBlockId: parent.id,
              level: "DAY",
              startDate: ranges[i].startDate,
              endDate: ranges[i].startDate,
              summary: day.summary,
              position: i + 1,
              tasks: {
                create: day.tasks.map((task, position) => ({
                  goalId,
                  title: task.title,
                  description: task.description || null,
                  type: task.type,
                  // Nula znamená „doba nedává smysl“, typicky u odpočinku.
                  // V databázi je to prázdná hodnota, ať UI nepíše „0 min“.
                  estimatedMinutes: task.estimatedMinutes || null,
                  position: position + 1,
                })),
              },
            },
            select: blockSelect,
          }),
        );
      }

      return created;
    });
  }

  const operation = unit === "WEEK" ? "DECOMPOSE_WEEKLY" : "DECOMPOSE_MONTHLY";

  const { children, usage } = await expandIntoBlocks({
    goal: context,
    parent: parentInput,
    childUnit: unit,
    ranges,
    siblingSummaries: parentSiblings
      .filter((sibling) => sibling.id !== parent.id)
      .map((sibling) => sibling.summary),
  }).catch(async (error) => {
    await accountFailure(userId, operation, label, error);
    throw error;
  });

  await recordUsage({
    userId,
    operation,
    usage,
    label: `${label} počet=${children.length}`,
  });

  const rows: Prisma.TimeBlockCreateManyInput[] = children.map((child, i) => ({
    goalId,
    parentBlockId: parent.id,
    level: unit as BlockLevel,
    startDate: ranges[i].startDate,
    endDate: ranges[i].endDate,
    title: child.title,
    summary: child.summary,
    position: i + 1,
  }));

  await db.timeBlock.createMany({ data: rows });

  return db.timeBlock.findMany({
    where: { parentBlockId: parent.id },
    orderBy: { position: "asc" },
    select: blockSelect,
  });
}
