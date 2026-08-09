import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { completeGoal } from "@/lib/goals/complete";

export const runtime = "nodejs";
// Uzavření cíle si vyžádá krátké volání modelu na závěrečné shrnutí.
export const maxDuration = 120;

const bodySchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]),
});

/**
 * Změna stavu cíle: pozastavit, znovu spustit, uzavřít jako dotažený.
 *
 * Pozastavený cíl nedostává denní úkoly, neubírá z denní kapacity ostatním
 * a nepočítá se do pětice běžících. Nic se nemaže — plán čeká, až se
 * uživatel vrátí.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const goal = await db.goal.findFirst({
    where: { id, userId: guard.user.id },
    select: { id: true, status: true },
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

  const next = parsed.data.status;

  if (next === "COMPLETED") {
    // Dotažený cíl se nezavírá dvakrát — druhé volání by přepsalo datum
    // dokončení i shrnutí, tedy přesně to, co si má člověk uchovat.
    if (goal.status === "COMPLETED") {
      return NextResponse.json({ ok: true, alreadyDone: true });
    }

    await completeGoal(goal.id);
    return NextResponse.json({ ok: true });
  }

  // Znovuotevření dotaženého cíle datum dokončení maže — jinak by pak
  // oslava tvrdila něco, co neplatí.
  await db.goal.update({
    where: { id: goal.id },
    data:
      goal.status === "COMPLETED"
        ? { status: next, completedAt: null, completionNote: null }
        : { status: next },
  });

  return NextResponse.json({ ok: true });
}
