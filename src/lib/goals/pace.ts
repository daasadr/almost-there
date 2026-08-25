import "server-only";
import { db } from "@/lib/db";
import { parseIsoDate, toIsoDate, todayIso } from "@/lib/plan/calendar";

/**
 * Vyhodnocení tempa: jde to podle plánu, nebo se nabral skluz?
 *
 * Plán, který mlčky pokračuje, i když se tři dny nic nestalo, je za týden
 * k ničemu — zbytek práce se natlačí do zbývajícího času a termín začne
 * lhát. Zadání proto počítá s tím, že se plán přizpůsobí skutečnosti,
 * ne naopak.
 */

/** Kolik vynechaných dnů znamená skluz. */
const MISSED_DAYS_THRESHOLD = 3;
/** V jak dlouhém okně se vynechané dny počítají. */
const WINDOW_DAYS = 14;
/**
 * Jak dlouho po odmítnutí mlčet. Kdo řekne „teď ne“, nemá to slyšet
 * hned zítra znovu — to už není nabídka, ale otravování.
 */
const SILENCE_AFTER_DECLINE_DAYS = 7;
/**
 * Dolní mez úspěšnosti pro výpočet nového termínu. Bez ní by při nule
 * hotových úkolů vyšel termín v nekonečnu.
 */
const MIN_RATE_FOR_ESTIMATE = 0.25;

export type PaceStatus = {
  goalId: string;
  /** Dnů v okně, kdy něco zůstalo nesplněné. */
  missedDays: number;
  /** Podíl hotových úkolů ze všech, které už měly být hotové (0–1). */
  completionRate: number;
  /** Má se uživateli nabídnout přeplánování? */
  behind: boolean;
  /** Původní termín. */
  targetDate: Date;
  /** Termín, který odpovídá skutečnému tempu. */
  suggestedDate: Date;
};

/**
 * Nový termín podle tempa, kterým to reálně jde.
 *
 * Zbývající práci protáhneme v poměru, ve kterém se dosud stíhalo:
 * kdo zvládl polovinu, potřebuje na zbytek dvakrát tolik času.
 */
export function estimateNewTarget(
  today: Date,
  targetDate: Date,
  completionRate: number,
): Date {
  const remainingDays = Math.max(
    7,
    Math.round((targetDate.getTime() - today.getTime()) / 86_400_000),
  );
  const rate = Math.max(MIN_RATE_FOR_ESTIMATE, completionRate);
  const stretched = Math.round(remainingDays / rate);

  // Zaokrouhlení na celé týdny — přesnost na den by tu jen předstírala
  // jistotu, kterou odhad z tempa nemá.
  const weeks = Math.ceil(stretched / 7);
  return new Date(today.getTime() + weeks * 7 * 86_400_000);
}

export async function getPaceStatus(
  goalId: string,
  timezone = "Europe/Prague",
): Promise<PaceStatus | null> {
  const goal = await db.goal.findUnique({
    where: { id: goalId },
    select: { id: true, targetDate: true, status: true, createdAt: true },
  });
  if (!goal || goal.status !== "ACTIVE") return null;

  const today = parseIsoDate(todayIso(timezone));

  /**
   * Od kdy počítat vynechané dny.
   *
   * Normálně čtrnáct dní zpátky. Po přeplánování ale od chvíle, kdy
   * k němu došlo — a to je podstatné.
   *
   * Přeplánování totiž minulost nemaže: dny, které už proběhly, zůstávají
   * i s nesplněnými úkoly, protože historie plnění je to jediné, z čeho
   * jde tempo vyčíst. Kdyby se vynechané dny počítaly dál od nich, nabídka
   * „dohnat, nebo posunout termín“ by se objevila hned po přeplánování
   * znovu — a klepnutí na ni by skončilo hláškou, že se přeplánovávalo
   * před chvílí. Uživatel by se v tom točil dokola.
   *
   * Po přeplánování je minulost vyřízená. Rozhoduje, jak se daří proti
   * novému plánu, a na to jsou potřeba nové dny.
   */
  const lastReplan = await db.replanEvent.findFirst({
    where: { goalId, reason: { not: "USER_DECLINED_REPLAN" } },
    orderBy: { triggeredAt: "desc" },
    select: { triggeredAt: true },
  });

  const windowStart = new Date(
    Math.max(
      today.getTime() - WINDOW_DAYS * 86_400_000,
      lastReplan?.triggeredAt.getTime() ?? 0,
    ),
  );

  // Dny, které už proběhly a měly naplánované úkoly.
  const pastDays = await db.timeBlock.findMany({
    where: {
      goalId,
      level: "DAY",
      startDate: { gte: windowStart, lt: today },
    },
    select: { startDate: true, tasks: { select: { status: true } } },
  });

  // Vynechaný den = den, ve kterém nebylo hotové všechno. Vědomě
  // odložený úkol se počítá taky: práce se neudělala, ať už kvůli
  // čemukoliv, a termín to posouvá stejně.
  const missedWithTasks = pastDays.filter(
    (day) =>
      day.tasks.length > 0 &&
      day.tasks.some((task) => task.status !== "DONE"),
  ).length;

  /**
   * Dny, na které se plán vůbec nedostal.
   *
   * Denní úkoly se rozepisují po obdobích a jen tehdy, když uživatel
   * aplikaci otevře. Kdo se dva týdny neozval, nemá na ty dny žádné
   * úkoly — a den bez úkolů se do počítadla výš nezapočítá. Aplikace
   * pak zrovna u toho, kdo úplně zmizel, tvrdila, že se nic neděje,
   * a nabídku „dohnat, nebo posunout termín" neukázala vůbec.
   *
   * Takový den je ale vynechaný nejvíc ze všech: neudělalo se nic
   * a plán o tom ani neví. Počítají se proto dny v okně, ke kterým
   * žádný denní blok neexistuje.
   *
   * Okno začíná nejpozději založením cíle — dny před ním nikomu
   * chybět nemohly.
   */
  const planned = new Set(pastDays.map((day) => toIsoDate(day.startDate)));
  const from = goal.createdAt > windowStart ? goal.createdAt : windowStart;

  let missedWithoutPlan = 0;
  for (
    let day = new Date(Math.max(from.getTime(), windowStart.getTime()));
    day < today;
    day = new Date(day.getTime() + 86_400_000)
  ) {
    if (!planned.has(toIsoDate(day))) missedWithoutPlan += 1;
  }

  const missedDays = missedWithTasks + missedWithoutPlan;

  // Úspěšnost se počítá z celé historie cíle, ne jen z okna — pár
  // špatných dnů po dobrém měsíci nemá znamenat, že se termín zdvojnásobí.
  const [doneCount, dueCount] = await Promise.all([
    db.task.count({ where: { goalId, status: "DONE" } }),
    db.task.count({
      where: { goalId, timeBlock: { level: "DAY", startDate: { lt: today } } },
    }),
  ]);

  const completionRate = dueCount > 0 ? doneCount / dueCount : 1;

  const recentlyDeclined = await db.replanEvent.findFirst({
    where: {
      goalId,
      reason: "USER_DECLINED_REPLAN",
      triggeredAt: {
        gte: new Date(today.getTime() - SILENCE_AFTER_DECLINE_DAYS * 86_400_000),
      },
    },
    select: { id: true },
  });

  return {
    goalId,
    missedDays,
    completionRate,
    behind: missedDays >= MISSED_DAYS_THRESHOLD && !recentlyDeclined,
    targetDate: goal.targetDate,
    suggestedDate: estimateNewTarget(today, goal.targetDate, completionRate),
  };
}

/** Tempo u všech běžících cílů najednou — pro přehled dnešku. */
export async function getBehindGoals(
  userId: string,
  timezone = "Europe/Prague",
): Promise<(PaceStatus & { title: string; color: string })[]> {
  const goals = await db.goal.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, title: true, color: true },
  });

  const statuses = await Promise.all(
    goals.map(async (goal) => {
      const status = await getPaceStatus(goal.id, timezone);
      return status?.behind
        ? { ...status, title: goal.title, color: goal.color }
        : null;
    }),
  );

  return statuses.filter((status) => status !== null);
}

/** Datum ve tvaru, ve kterém ho čeká rozpad. */
export function toTargetIso(date: Date): string {
  return toIsoDate(date);
}
