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
 * Posledních N dní pro proužek postupu.
 *
 * Vrací se i dny bez záznamu, aby proužek nepřeskakoval — den, kdy se
 * nic nedělo, je taky informace.
 */
export async function getRecentProgress(
  userId: string,
  timezone = "Europe/Prague",
  days = 30,
): Promise<DayProgress[]> {
  const today = parseIsoDate(todayIso(timezone));
  const from = new Date(today.getTime() - (days - 1) * 86_400_000);

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
      where: { userId, date: { gte: from, lte: today } },
      select: { date: true, tasksTotal: true, tasksCompleted: true },
    }),
    db.timeBlock.findMany({
      where: {
        goal: { userId, status: "ACTIVE" },
        level: "DAY",
        startDate: { gte: from, lte: today },
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

  const checkIns = await db.checkIn.findMany({
    where: { userId, date: { gte: monday, lte: sunday } },
    select: { date: true, tasksTotal: true, tasksCompleted: true },
  });

  const byDate = new Map(
    checkIns.map((entry) => [
      toIsoDate(entry.date),
      { total: entry.tasksTotal, done: entry.tasksCompleted },
    ]),
  );

  // Dnešek se do souhrnů zapisuje až při prvním odškrtnutí, takže by
  // v proužku chyběl, dokud člověk nic neudělá. Doplníme ho z úkolů.
  if (!byDate.has(today) && today >= toIsoDate(monday) && today <= toIsoDate(sunday)) {
    const where = {
      goal: { userId, status: "ACTIVE" as const },
      timeBlock: { level: "DAY" as const, startDate: parseIsoDate(today) },
    };
    const [total, done] = await Promise.all([
      db.task.count({ where }),
      db.task.count({ where: { ...where, status: "DONE" } }),
    ]);
    if (total > 0) byDate.set(today, { total, done });
  }

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
