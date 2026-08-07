import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";

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

  // updateMany s userId v podmínce: cizí úkol tak neaktualizujeme ani
  // v případě, že by někdo poslal cizí id.
  const result = await db.task.updateMany({
    where: { id, goal: { userId: guard.user.id } },
    data: {
      status: parsed.data.status,
      completedAt: parsed.data.status === "DONE" ? new Date() : null,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
