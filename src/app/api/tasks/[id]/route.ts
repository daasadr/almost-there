import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { recordCheckIn } from "@/lib/goals/checkin";

export const runtime = "nodejs";

const bodySchema = z.object({
  status: z.enum(["PENDING", "DONE", "SKIPPED"]),
});

/** Odškrtnutí úkolu. Jediná operace, kterou uživatel dělá každý den. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  const { id } = await params;

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

  // Den, do kterého úkol patří — potřebný pro denní souhrn. Načítá se
  // spolu s ověřením vlastnictví, ať to není dotaz navíc.
  const task = await db.task.findFirst({
    where: { id, goal: { userId: guard.user.id } },
    select: { id: true, timeBlock: { select: { startDate: true } } },
  });

  if (!task) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  await db.task.update({
    where: { id: task.id },
    data: {
      status: parsed.data.status,
      completedAt: parsed.data.status === "DONE" ? new Date() : null,
    },
  });

  // Souhrn se přepočítá pro den úkolu, ne pro dnešek — dodělaný úkol
  // z minulého týdne patří do svého dne, jinak by přehled postupu lhal.
  await recordCheckIn(guard.user.id, task.timeBlock.startDate);

  return NextResponse.json({ ok: true });
}
