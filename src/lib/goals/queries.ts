import "server-only";
import { db } from "@/lib/db";
import { parseIsoDate, todayIso } from "@/lib/plan/calendar";
import type { BlockLevel, TaskStatus, TaskType } from "@/generated/prisma";

/** Čtecí dotazy nad plánem. Zápis a generování řeší planner.ts. */

export type GoalSummary = {
  id: string;
  title: string;
  targetDate: Date;
  status: string;
  color: string;
  completedAt: Date | null;
  completionNote: string | null;
  feasibility: string | null;
  tasksTotal: number;
  tasksDone: number;
};

export async function listGoals(userId: string): Promise<GoalSummary[]> {
  const goals = await db.goal.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { completedAt: "desc" }, { targetDate: "asc" }],
    select: {
      id: true,
      title: true,
      targetDate: true,
      status: true,
      color: true,
      completedAt: true,
      completionNote: true,
      feasibility: true,
      _count: { select: { tasks: true } },
    },
  });

  // Hotové úkoly zvlášť — Prisma neumí filtrovaný _count v jednom dotazu.
  const done = await db.task.groupBy({
    by: ["goalId"],
    where: { goal: { userId }, status: "DONE" },
    _count: { _all: true },
  });
  const doneByGoal = new Map(done.map((row) => [row.goalId, row._count._all]));

  return goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    targetDate: goal.targetDate,
    status: goal.status,
    color: goal.color,
    completedAt: goal.completedAt,
    completionNote: goal.completionNote,
    feasibility: goal.feasibility,
    tasksTotal: goal._count.tasks,
    tasksDone: doneByGoal.get(goal.id) ?? 0,
  }));
}

export type PlanNode = {
  id: string;
  level: BlockLevel;
  startDate: Date;
  endDate: Date;
  title: string | null;
  summary: string;
  children: PlanNode[];
  tasks: {
    id: string;
    title: string;
    description: string | null;
    type: TaskType;
    status: TaskStatus;
    estimatedMinutes: number | null;
  }[];
};

export type GoalDetail = {
  id: string;
  title: string;
  description: string | null;
  targetDate: Date;
  status: string;
  color: string;
  restatement: string | null;
  assumptions: string[];
  feasibility: string | null;
  feasibilityNote: string | null;
  tree: PlanNode[];
  images: { id: string; width: number; height: number; alt: string | null }[];
};

export async function getGoalDetail(
  userId: string,
  goalId: string,
): Promise<GoalDetail | null> {
  const goal = await db.goal.findFirst({
    // userId v podmínce, ne až v kontrole po načtení — cizí cíl se tak
    // nedá vytáhnout ani omylem.
    where: { id: goalId, userId },
    select: {
      id: true,
      title: true,
      description: true,
      targetDate: true,
      status: true,
      color: true,
      restatement: true,
      assumptions: true,
      feasibility: true,
      feasibilityNote: true,
      images: {
        orderBy: { createdAt: "asc" },
        select: { id: true, width: true, height: true, alt: true },
      },
    },
  });
  if (!goal) return null;

  const blocks = await db.timeBlock.findMany({
    where: { goalId },
    orderBy: [{ startDate: "asc" }, { position: "asc" }],
    select: {
      id: true,
      level: true,
      startDate: true,
      endDate: true,
      title: true,
      summary: true,
      parentBlockId: true,
      tasks: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          estimatedMinutes: true,
        },
      },
    },
  });

  // Strom skládáme v paměti. Bloků je řádově desítky, takže rekurzivní
  // dotazování by bylo dražší než jeden select a chvilka práce tady.
  const nodes = new Map<string, PlanNode>();
  for (const block of blocks) {
    nodes.set(block.id, {
      id: block.id,
      level: block.level,
      startDate: block.startDate,
      endDate: block.endDate,
      title: block.title,
      summary: block.summary,
      children: [],
      tasks: block.tasks,
    });
  }

  const roots: PlanNode[] = [];
  for (const block of blocks) {
    const node = nodes.get(block.id)!;
    const parent = block.parentBlockId
      ? nodes.get(block.parentBlockId)
      : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  return { ...goal, tree: roots };
}

export type TodayTask = {
  id: string;
  goalId: string;
  goalTitle: string;
  goalColor: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  estimatedMinutes: number | null;
};

export type TodayView = {
  date: string;
  tasks: TodayTask[];
  /** Aktivní cíle, které na dnešek zatím rozpad nemají. */
  goalsNeedingPlan: { id: string; title: string }[];
  /**
   * Jeden obrázek na cíl, vybraný podle data.
   *
   * Vybírá se na serveru, ne v prohlížeči: náhoda při každém překreslení
   * by obrázek měnila pod rukama a z připomínky, proč to člověk dělá, by
   * byla blikající dekorace.
   */
  dailyImages: Record<string, { id: string; alt: string | null }>;
};

export type OverdueTask = TodayTask & { date: Date };

/**
 * Nesplněné úkoly z minulých dnů.
 *
 * Bez nich plán mlčky přejde vynechaný den a učí tím, že na plnění
 * nezáleží. Zpátky se ale nekouká donekonečna: po týdnu už zbylý úkol
 * není připomínka, ale výčitka, a plán se mezitím posunul jinam.
 */
export async function getOverdue(
  userId: string,
  timezone = "Europe/Prague",
  days = 7,
): Promise<OverdueTask[]> {
  const today = parseIsoDate(todayIso(timezone));
  const from = new Date(today.getTime() - days * 86_400_000);

  const tasks = await db.task.findMany({
    where: {
      goal: { userId, status: "ACTIVE" },
      status: "PENDING",
      OR: [
        // Přesunutý na den, který už minul. Bez tohohle by úkol odložený
        // do minulosti tiše zmizel — nikde by nebyl a nikdo by se o něm
        // nedozvěděl.
        { deferredTo: { gte: from, lt: today } },
        {
          deferredTo: null,
          timeBlock: { level: "DAY", startDate: { gte: from, lt: today } },
        },
      ],
    },
    orderBy: [{ timeBlock: { startDate: "desc" } }, { position: "asc" }],
    select: {
      id: true,
      goalId: true,
      title: true,
      description: true,
      type: true,
      status: true,
      estimatedMinutes: true,
      deferredTo: true,
      goal: { select: { title: true, color: true } },
      timeBlock: { select: { startDate: true } },
    },
  });

  return tasks.map(({ goal, timeBlock, deferredTo, ...task }) => ({
    ...task,
    goalTitle: goal.title,
    goalColor: goal.color,
    // U přesunutého úkolu je jeho dnem ten, na který byl přesunutý.
    // Původní den už nic neznamená a ukazovat ho by mátlo.
    date: deferredTo ?? timeBlock.startDate,
  }));
}

/**
 * Úkoly jednoho dne.
 *
 * Bere volitelné datum, aby šlo nahlédnout do minulých i do už
 * rozfázovaných budoucích dnů. Dogenerování se ale nabízí jen u dneška —
 * u jiného dne by to znamenalo utrácet za plán, na který se člověk jen
 * podíval.
 */
export async function getToday(
  userId: string,
  timezone = "Europe/Prague",
  requestedDate?: string,
): Promise<TodayView> {
  const today = todayIso(timezone);
  const date = requestedDate ?? today;
  const day = parseIsoDate(date);

  const tasks = await db.task.findMany({
    where: {
      goal: { userId, status: "ACTIVE" },
      // Odložený stranou bez data se neukazuje nikde v denním výhledu —
      // má vlastní seznam, kde čeká, až mu uživatel řekne kdy.
      status: { not: "DEFERRED" },
      OR: [
        // Přesunutý na tenhle den. Přebíjí den, do kterého byl naplánovaný.
        { deferredTo: day },
        // Nepřesunutý, patřící do tohohle dne.
        { deferredTo: null, timeBlock: { level: "DAY", startDate: day } },
      ],
    },
    orderBy: [{ goalId: "asc" }, { position: "asc" }],
    select: {
      id: true,
      goalId: true,
      title: true,
      description: true,
      type: true,
      status: true,
      estimatedMinutes: true,
      goal: { select: { title: true, color: true } },
    },
  });

  const activeGoals = await db.goal.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, title: true, targetDate: true },
  });

  // Rozhoduje existence denního bloku, ne to, jestli v něm jsou úkoly.
  // Kdyby se ptalo na úkoly, den bez nich by se pokoušel dorozpadat pořád
  // dokola — rozpad by se přitom už nespustil, protože blok existuje.
  const planned = await db.timeBlock.findMany({
    where: { goal: { userId }, level: "DAY", startDate: day },
    select: { goalId: true },
    distinct: ["goalId"],
  });

  const plannedGoalIds = new Set(planned.map((block) => block.goalId));
  const goalsNeedingPlan = date !== today
    ? []
    : activeGoals
    // Cíl po termínu už dogenerovávat nemá cenu — čeká na uzavření
    // nebo přeplánování, ne na další úkoly.
    .filter((goal) => goal.targetDate >= day && !plannedGoalIds.has(goal.id))
    .map((goal) => ({ id: goal.id, title: goal.title }));

  const goalIds = [...new Set(tasks.map((task) => task.goalId))];
  const images = goalIds.length
    ? await db.goalImage.findMany({
        where: { goalId: { in: goalIds } },
        orderBy: { createdAt: "asc" },
        select: { id: true, goalId: true, alt: true },
      })
    : [];

  // Den jako číslo — stejný postup jako u pochval za dokončený den.
  const dayNumber = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const dailyImages: TodayView["dailyImages"] = {};

  for (const goalId of goalIds) {
    const forGoal = images.filter((image) => image.goalId === goalId);
    if (forGoal.length === 0) continue;

    const chosen = forGoal[dayNumber % forGoal.length];
    dailyImages[goalId] = { id: chosen.id, alt: chosen.alt };
  }

  return {
    date,
    tasks: tasks.map(({ goal, ...task }) => ({
      ...task,
      goalTitle: goal.title,
      goalColor: goal.color,
    })),
    goalsNeedingPlan,
    dailyImages,
  };
}

/**
 * Úkoly odložené stranou bez data.
 *
 * Existují proto, aby uživatel nemusel lhát ani nechat úkol propadnout,
 * když neví, kdy na něj bude mít. Musí ale být někde vidět — odložený
 * a zapomenutý úkol je to samé jako smazaný, jen bez rozhodnutí.
 */
export async function getDeferred(userId: string): Promise<TodayTask[]> {
  const tasks = await db.task.findMany({
    where: {
      goal: { userId, status: "ACTIVE" },
      status: "DEFERRED",
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      goalId: true,
      title: true,
      description: true,
      type: true,
      status: true,
      estimatedMinutes: true,
      goal: { select: { title: true, color: true } },
    },
  });

  return tasks.map(({ goal, ...task }) => ({
    ...task,
    goalTitle: goal.title,
    goalColor: goal.color,
  }));
}
