import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { createGoalWithPlan } from "@/lib/goals/planner";
import { AiBudgetError } from "@/lib/ai/usage";
import {
  validateGoal,
  validateTargetDate,
  MAX_GOAL_LENGTH,
} from "@/lib/demo-validation";

export const runtime = "nodejs";
// Rozpad trvá desítky sekund; výchozí limit by ho uřízl uprostřed.
export const maxDuration = 300;

/** Kolik cílů smí běžet najednou. Nad tímhle počtem se plán stejně
 *  nedá poctivě harmonizovat — den má jen tolik hodin. */
const MAX_ACTIVE_GOALS = 5;

const bodySchema = z.object({
  title: z.string(),
  description: z.string().max(1000).optional(),
  targetDate: z.string(),
});

export async function POST(request: Request) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const title = parsed.data.title.trim();

  const titleError = validateGoal(title);
  if (titleError) {
    return NextResponse.json({ ok: false, error: titleError }, { status: 400 });
  }

  const dateError = validateTargetDate(parsed.data.targetDate);
  if (dateError) {
    return NextResponse.json({ ok: false, error: dateError }, { status: 400 });
  }

  const activeCount = await db.goal.count({
    where: { userId: guard.user.id, status: "ACTIVE" },
  });
  if (activeCount >= MAX_ACTIVE_GOALS) {
    return NextResponse.json(
      { ok: false, error: "tooManyGoals" },
      { status: 409 },
    );
  }

  try {
    const goalId = await createGoalWithPlan({
      userId: guard.user.id,
      title,
      description: parsed.data.description?.slice(0, MAX_GOAL_LENGTH * 4),
      targetDate: parsed.data.targetDate,
    });

    return NextResponse.json({ ok: true, goalId });
  } catch (error) {
    if (error instanceof AiBudgetError) {
      return NextResponse.json(
        { ok: false, error: "budgetExhausted" },
        { status: 429 },
      );
    }

    console.error("[goals] založení cíle selhalo", error);
    return NextResponse.json({ ok: false, error: "aiFailed" }, { status: 502 });
  }
}
