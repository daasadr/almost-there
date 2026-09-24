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
/**
 * Kolik posledních dnů rozhoduje o tom, že je skluz zažehnaný.
 *
 * Kratší než okno schválně: okno je na to, aby se skluz poznal, tohle
 * na to, aby se poznalo, že skončil. Pět dnů je dost na to, aby to
 * nebyla náhoda jednoho večera, a málo na to, aby se čekalo týden.
 */
const RECOVERY_DAYS = 5;

/**
 * Má uživatel skluz za sebou?
 *
 * Počítadlo vynechaných dnů samo o sobě neví, *kdy* se vynechalo — a bez
 * toho se stane tohle: člověk týden nestíhá, pak se osm dní po sobě
 * trefí do všeho, a aplikace mu pořád nabízí posunutí termínu s větou
 * „poslední dny se nedotáhly“. Přitom poslední dny má hotové do jednoho
 * a ta věta je nepravda — vynechané dny jsou staré přes týden.
 *
 * Kdo se vrátil do tempa, nepotřebuje přeplánovat. Potřebuje pokoj.
 *
 * Nestačí ale, aby posledních pár dnů bylo „bez vynechání“: den, na
 * který plán nedošel, se taky nikde neobjeví. Musí tedy aspoň jeden
 * z nich být skutečně naplánovaný, jinak by za návrat do tempa prošlo
 * i úplné ticho.
 */
export function hasRecovered(
  missedDates: Iterable<string>,
  plannedDates: Iterable<string>,
  today: Date,
  days: number = RECOVERY_DAYS,
): boolean {
  const missed = new Set(missedDates);
  const planned = new Set(plannedDates);

  let plannedInStretch = 0;

  for (let back = 1; back <= days; back++) {
    const iso = toIsoDate(new Date(today.getTime() - back * 86_400_000));
    if (missed.has(iso)) return false;
    if (planned.has(iso)) plannedInStretch += 1;
  }

  return plannedInStretch > 0;
}

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

  const plannedDates = new Set(pastDays.map((day) => toIsoDate(day.startDate)));

  /**
   * Které dny se vynechaly. Ne kolik — které: podle toho se pozná,
   * jestli je skluz čerstvý, nebo dávno za námi. Viz `hasRecovered`.
   */
  const missedDates = new Set<string>();

  // Vynechaný den = den, ve kterém nebylo hotové všechno. Vědomě
  // odložený úkol se počítá taky: práce se neudělala, ať už kvůli
  // čemukoliv, a termín to posouvá stejně.
  for (const day of pastDays) {
    if (day.tasks.length > 0 && day.tasks.some((t) => t.status !== "DONE")) {
      missedDates.add(toIsoDate(day.startDate));
    }
  }

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
  /**
   * Odkdy má smysl počítat dny, na které se plán nedostal.
   *
   * Ne od založení cíle. Mezi „mám cíl“ a „mám rozepsané dny“ je krok,
   * který dělá uživatel sám — a dokud ho neudělá, žádné denní úkoly
   * neexistují. Bez téhle hranice se cíl, který si někdo večer založil
   * a nechal ležet, po třech dnech sám ohlásil jako zmeškaný a nabídl
   * posunutí termínu plánu, který ještě nikdo nenapsal.
   *
   * Rozhoduje proto první rozepsaný den. Kdo ho nemá, nemá co zmeškat;
   * kdo ho má a pak zmizel, ten ano — a přesně na to je tohle počítadlo.
   */
  const firstPlanned = await db.timeBlock.findFirst({
    where: { goalId, level: "DAY" },
    orderBy: { startDate: "asc" },
    select: { startDate: true },
  });

  const from = [
    windowStart,
    goal.createdAt,
    firstPlanned?.startDate ?? today,
  ].reduce((latest, date) => (date > latest ? date : latest));

  for (
    let day = new Date(from.getTime());
    day < today;
    day = new Date(day.getTime() + 86_400_000)
  ) {
    const iso = toIsoDate(day);
    if (!plannedDates.has(iso)) missedDates.add(iso);
  }

  const missedDays = missedDates.size;

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
    /**
     * Nabídka se ukáže jen tomu, kdo skluz *teď* má. Ne tomu, kdo ho
     * měl před deseti dny a od té doby se trefuje do všeho — ten by
     * jinak koukal na větu o nedotažených dnech, které má odškrtané.
     */
    behind:
      missedDays >= MISSED_DAYS_THRESHOLD &&
      !hasRecovered(missedDates, plannedDates, today) &&
      !recentlyDeclined,
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
