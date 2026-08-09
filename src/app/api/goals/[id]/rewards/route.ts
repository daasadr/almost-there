import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { suggestRewards } from "@/lib/goals/milestones";
import { AiBudgetError, assertWithinBudget } from "@/lib/ai/usage";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Návrhy odměn pro milníky, které zatím žádnou nemají. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const goal = await db.goal.findFirst({
    where: { id, userId: guard.user.id },
    select: { id: true },
  });
  if (!goal) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  try {
    await assertWithinBudget(guard.user.id);
    const count = await suggestRewards(id);
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    if (error instanceof AiBudgetError) {
      return NextResponse.json(
        { ok: false, error: "budgetExhausted" },
        { status: 429 },
      );
    }

    console.error("[goals] návrh odměn selhal", id, error);
    return NextResponse.json({ ok: false, error: "aiFailed" }, { status: 502 });
  }
}
