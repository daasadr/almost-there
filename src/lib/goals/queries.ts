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
  feasibility: string | null;
  tasksTotal: number;
  tasksDone: number;
};

export async function listGoals(userId: string): Promise<GoalSummary[]> {
  const goals = await db.goal.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { targetDate: "asc" }],
    select: {
      id: true,
      title: true,
      targetDate: true,
      status: true,
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
  restatement: string | null;
  assumptions: string[];
  feasibility: string | null;
  feasibilityNote: string | null;
  tree: PlanNode[];
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
      restatement: true,
      assumptions: true,
      feasibility: true,
      feasibilityNote: true,
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
};

export async function getToday(
  userId: string,
  timezone = "Europe/Prague",
): Promise<TodayView> {
  const date = todayIso(timezone);
  const day = parseIsoDate(date);

  const tasks = await db.task.findMany({
    where: {
      goal: { userId, status: "ACTIVE" },
      timeBlock: { level: "DAY", startDate: day },
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
      goal: { select: { title: true } },
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
  const goalsNeedingPlan = activeGoals
    // Cíl po termínu už dogenerovávat nemá cenu — čeká na uzavření
    // nebo přeplánování, ne na další úkoly.
    .filter((goal) => goal.targetDate >= day && !plannedGoalIds.has(goal.id))
    .map((goal) => ({ id: goal.id, title: goal.title }));

  return {
    date,
    tasks: tasks.map(({ goal, ...task }) => ({
      ...task,
      goalTitle: goal.title,
    })),
    goalsNeedingPlan,
  };
}
