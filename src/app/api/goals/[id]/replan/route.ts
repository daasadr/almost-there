import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { AiBudgetError } from "@/lib/ai/usage";
import { declineReplan, replanGoal, ReplanTooSoonError } from "@/lib/goals/replan";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  mode: z.enum(["catchUp", "moveDeadline", "decline", "adjust"]),
  /**
   * Co si uživatel přeje dělat jinak. Jen u režimu „adjust“.
   *
   * Strop je štědrý, ale ne bezedný — text jde do promptu a platí se za
   * něj v tokenech. Dole je krátká mez schválně: z holého „nelíbí se mi
   * to“ nový plán nevznikne a je lepší říct to hned než za minutu
   * a za peníze.
   */
  steer: z.string().trim().min(10).max(1000).optional(),
});

/** Přeplánování cíle po skluzu, nebo odmítnutí nabídky. */
export async function POST(
  request: Request,
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

  if (parsed.data.mode === "decline") {
    await declineReplan(id);
    return NextResponse.json({ ok: true });
  }

  // Úprava směru bez popisu je jen drahé zamíchání plánem.
  if (parsed.data.mode === "adjust" && !parsed.data.steer) {
    return NextResponse.json(
      { ok: false, error: "steerRequired" },
      { status: 400 },
    );
  }

  try {
    const { newTargetDate } = await replanGoal({
      goalId: id,
      mode: parsed.data.mode,
      steer: parsed.data.steer,
    });
    return NextResponse.json({ ok: true, newTargetDate });
  } catch (error) {
    if (error instanceof ReplanTooSoonError) {
      return NextResponse.json(
        { ok: false, error: "replanTooSoon" },
        { status: 429 },
      );
    }
    if (error instanceof AiBudgetError) {
      return NextResponse.json(
        { ok: false, error: "budgetExhausted" },
        { status: 429 },
      );
    }

    console.error("[goals] přeplánování selhalo", id, error);
    return NextResponse.json({ ok: false, error: "aiFailed" }, { status: 502 });
  }
}
