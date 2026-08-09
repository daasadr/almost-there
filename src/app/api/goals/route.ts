import { NextResponse } from "next/server";
import { z } from "zod";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { createGoalWithPlan } from "@/lib/goals/planner";
import { AiBudgetError, PlanAllowanceError } from "@/lib/ai/usage";
import { env } from "@/lib/env";
import { isGoalColor } from "@/lib/plan/colors";
import {
  validateGoal,
  validateTargetDate,
  MAX_GOAL_LENGTH,
} from "@/lib/demo-validation";

export const runtime = "nodejs";
// Rozpad trvá desítky sekund; výchozí limit by ho uřízl uprostřed.
export const maxDuration = 300;

const bodySchema = z.object({
  title: z.string(),
  description: z.string().max(1000).optional(),
  targetDate: z.string(),
  locale: z.string().optional(),
  importance: z.number().int().min(1).max(5).optional(),
  color: z.string().optional(),
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
  if (activeCount >= env.maxActiveGoals) {
    return NextResponse.json(
      { ok: false, error: "tooManyGoals" },
      { status: 409 },
    );
  }

  try {
    // Jazyk stránky, ne účtu. U účtů z Googlu zakládá uživatele adaptér
    // a preferenci jazyka nezná, takže by plán vyšel anglicky i člověku,
    // který má aplikaci celou v češtině.
    const locale: Locale = hasLocale(routing.locales, parsed.data.locale)
      ? parsed.data.locale
      : hasLocale(routing.locales, guard.user.locale)
        ? guard.user.locale
        : routing.defaultLocale;

    const goalId = await createGoalWithPlan({
      userId: guard.user.id,
      title,
      description: parsed.data.description?.slice(0, MAX_GOAL_LENGTH * 4),
      targetDate: parsed.data.targetDate,
      locale,
      importance: parsed.data.importance,
      // Neznámou hodnotu zahodíme, ať se do databáze nedostane barva,
      // kterou paleta nezná a UI by ji stejně nevykreslilo.
      color: isGoalColor(parsed.data.color) ? parsed.data.color : undefined,
    });

    return NextResponse.json({ ok: true, goalId });
  } catch (error) {
    if (error instanceof PlanAllowanceError) {
      return NextResponse.json(
        { ok: false, error: "planLimitReached" },
        { status: 429 },
      );
    }

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
