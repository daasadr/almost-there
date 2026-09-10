import "server-only";
import { db } from "@/lib/db";
import { parseIsoDate, toIsoDate, todayIso } from "@/lib/plan/calendar";

/**
 * Denní souhrn plnění (zadání, bod 5).
 *
 * Zapisuje se při každém odškrtnutí, ne nočním úklidem. Plánovač bez
 * naplánované úlohy je jednodušší na provoz a hlavně: souhrn je hotový
 * hned, ne až ráno — takže se dá ukázat uživateli ve chvíli, kdy ho
 * zajímá.
 *
 * Souhrn je za celý den napříč cíli. Kdo si vede dobře v jednom cíli
 * a druhý zanedbává, má vidět skutečnost, ne dva oddělené příběhy.
 */

/** Přepočítá a uloží souhrn za jeden den. */
export async function recordCheckIn(
  userId: string,
  date: Date,
): Promise<void> {
  const where = {
    goal: { userId, status: "ACTIVE" as const },
    timeBlock: { level: "DAY" as const, startDate: date },
  };

  const [tasksTotal, tasksCompleted] = await Promise.all([
    db.task.count({ where }),
    db.task.count({ where: { ...where, status: "DONE" } }),
  ]);

  // Den bez úkolů se nezaznamenává — prázdný řádek by v přehledu vypadal
  // jako neúspěch, přitom to může být plánované volno nebo den, na který
  // se ještě nedošlo.
  if (tasksTotal === 0) return;

  await db.checkIn.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, tasksTotal, tasksCompleted },
    update: { tasksTotal, tasksCompleted },
  });
}

export type DayProgress = {
  date: string;
  total: number;
  done: number;
};

/**
 * Plnění po dnech mezi dvěma daty, včetně obou konců.
 *
 * Společný základ pro proužek posledních třiceti dnů i pro kalendář.
 * Vrací jen dny, o kterých se něco ví — chybějící klíč znamená den bez
 * plánu, ne den bez práce.
 */
async function progressBetween(
  userId: string,
  from: Date,
  to: Date,
): Promise<Map<string, { total: number; done: number }>> {
  /**
   * Dva zdroje, a ten druhý je tu kvůli chybě, která proužku brala smysl.
   *
   * Souhrn dne vzniká až při odškrtnutí úkolu. Den, kdy člověk neudělal
   * vůbec nic, tedy žádný souhrn nemá — a protože se dny bez souhrnu
   * braly jako dny bez plánu, vypadly z počítadla úplně, z čitatele
   * i ze jmenovatele. Proužek pak u člověka, který tři dny nic nedělal,
   * hlásil „23 z 23 dní celých“: jediná cesta k číslu pod sto procent
   * bylo odškrtnout část úkolů a zbytek ne.
   *
   * Dny bez souhrnu se proto dopočítají z úkolů. Souhrn má přednost tam,
   * kde je — přežije totiž i dokončení nebo smazání cíle, což je přesně
   * to, proč se vede.
   */
  const [checkIns, plannedDays] = await Promise.all([
    db.checkIn.findMany({
      where: { userId, date: { gte: from, lte: to } },
      select: { date: true, tasksTotal: true, tasksCompleted: true },
    }),
    db.timeBlock.findMany({
      where: {
        goal: { userId, status: "ACTIVE" },
        level: "DAY",
        startDate: { gte: from, lte: to },
      },
      select: { startDate: true, tasks: { select: { status: true } } },
    }),
  ]);

  const byDate = new Map<string, { total: number; done: number }>();

  // Nejdřív z úkolů. Jeden den může mít bloky od víc cílů, takže se
  // sčítají — souhrn je za celý den napříč cíli, ne za jeden cíl.
  for (const block of plannedDays) {
    const date = toIsoDate(block.startDate);
    const entry = byDate.get(date) ?? { total: 0, done: 0 };
    entry.total += block.tasks.length;
    entry.done += block.tasks.filter((task) => task.status === "DONE").length;
    byDate.set(date, entry);
  }

  // Souhrn přepisuje dopočet.
  for (const entry of checkIns) {
    byDate.set(toIsoDate(entry.date), {
      total: entry.tasksTotal,
      done: entry.tasksCompleted,
    });
  }

  return byDate;
}

/** Posledních N dní pro proužek postupu. */
export async function getRecentProgress(
  userId: string,
  timezone = "Europe/Prague",
  days = 30,
): Promise<DayProgress[]> {
  const today = parseIsoDate(todayIso(timezone));
  const from = new Date(today.getTime() - (days - 1) * 86_400_000);
  const byDate = await progressBetween(userId, from, today);

  return Array.from({ length: days }, (_, index) => {
    const date = toIsoDate(new Date(from.getTime() + index * 86_400_000));
    const entry = byDate.get(date);
    return { date, total: entry?.total ?? 0, done: entry?.done ?? 0 };
  });
}

export type WeekDay = DayProgress & {
  /** Je to dnešek? */
  isToday: boolean;
  /** Leží den v budoucnosti? */
  isFuture: boolean;
};

/**
 * Sedm dní týdne, ve kterém leží zadané datum.
 *
 * Týden začíná pondělkem, stejně jako se dělí plán — kdyby se lišil,
 * neseděl by proužek s tím, co je v aplikaci týden.
 *
 * Vrací i dny bez plánu. Prázdné okénko je informace sama o sobě: buď
 * je podle plánu volno, nebo se na ten den ještě nedošlo.
 */
export async function getWeekProgress(
  userId: string,
  timezone: string,
  anyDayOfWeek: string,
): Promise<WeekDay[]> {
  const today = todayIso(timezone);
  const anchor = parseIsoDate(anyDayOfWeek);

  // Pondělí téhož týdne. `getUTCDay` vrací 0 pro neděli, proto ta úprava.
  const weekday = anchor.getUTCDay();
  const monday = new Date(
    anchor.getTime() - (weekday === 0 ? 6 : weekday - 1) * 86_400_000,
  );
  const sunday = new Date(monday.getTime() + 6 * 86_400_000);

  /**
   * Přes společný dopočet, ne jen ze souhrnů.
   *
   * Dřív se tu četly jen souhrny a zvlášť se dopočítával dnešek, protože
   * ten svůj souhrn dostane až při prvním odškrtnutí. Jenže to platí
   * o každém dni: kdo v úterý neudělal nic, neměl za úterý souhrn a
   * v proužku vyšlo prázdné okénko — k nerozeznání od dne, na který se
   * plán nedostal. Vynechaný den tak nešlo ukázat vůbec.
   */
  const byDate = await progressBetween(userId, monday, sunday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = toIsoDate(new Date(monday.getTime() + index * 86_400_000));
    const entry = byDate.get(date);

    return {
      date,
      total: entry?.total ?? 0,
      done: entry?.done ?? 0,
      isToday: date === today,
      isFuture: date > today,
    };
  });
}

export type CalendarDay = WeekDay & {
  /** Patří den do zobrazovaného měsíce, nebo jen dorovnává mřížku? */
  inMonth: boolean;
};

/**
 * Celý měsíc do mřížky kalendáře.
 *
 * Vrací i dny okolních měsíců, které dorovnávají první a poslední řádek —
 * kalendář s uřízlým týdnem se špatně čte. Jsou označené `inMonth: false`,
 * ať se dají potlačit.
 *
 * Týden začíná pondělkem, stejně jako se dělí plán i jako v týdenním
 * proužku. Kdyby se to lišilo, neseděly by na sebe.
 *
 * @param month ve tvaru YYYY-MM
 */
export async function getMonthProgress(
  userId: string,
  timezone: string,
  month: string,
): Promise<CalendarDay[]> {
  const today = todayIso(timezone);
  const first = parseIsoDate(`${month}-01`);

  const last = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  );

  // Doleva k pondělí, doprava k neděli.
  const leading = first.getUTCDay() === 0 ? 6 : first.getUTCDay() - 1;
  const gridStart = new Date(first.getTime() - leading * 86_400_000);

  const trailing = last.getUTCDay() === 0 ? 0 : 7 - last.getUTCDay();
  const gridEnd = new Date(last.getTime() + trailing * 86_400_000);

  const byDate = await progressBetween(userId, gridStart, gridEnd);

  const length = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86_400_000) + 1;

  return Array.from({ length }, (_, index) => {
    const date = toIsoDate(new Date(gridStart.getTime() + index * 86_400_000));
    const entry = byDate.get(date);

    return {
      date,
      total: entry?.total ?? 0,
      done: entry?.done ?? 0,
      isToday: date === today,
      isFuture: date > today,
      inMonth: date.slice(0, 7) === month,
    };
  });
}
