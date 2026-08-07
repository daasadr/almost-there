import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { ensureCurrentPlan } from "@/lib/goals/planner";
import { AiBudgetError } from "@/lib/ai/usage";

export const runtime = "nodejs";
// Může se dogenerovávat i několik úrovní za sebou.
export const maxDuration = 300;

/**
 * Dorozpadá plán cíle tak, aby na dnešek existovaly úkoly.
 *
 * Je to bezpečné volat opakovaně — když už rozpad existuje, neudělá nic
 * a nic nestojí.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  // Vlastnictví ověřujeme zvlášť: bez toho by šlo dorozpadávat cizí cíle
  // a utrácet za to cizí rozpočet.
  const goal = await db.goal.findFirst({
    where: { id, userId: guard.user.id },
    select: { id: true },
  });
  if (!goal) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  try {
    const progress = await ensureCurrentPlan(id);
    return NextResponse.json({ ok: true, ...progress });
  } catch (error) {
    if (error instanceof AiBudgetError) {
      return NextResponse.json(
        { ok: false, error: "budgetExhausted" },
        { status: 429 },
      );
    }

    console.error("[goals] dorozpad plánu selhal", id, error);
    return NextResponse.json({ ok: false, error: "aiFailed" }, { status: 502 });
  }
}
