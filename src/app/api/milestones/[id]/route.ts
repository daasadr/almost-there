import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";

export const runtime = "nodejs";

const bodySchema = z.object({
  /** Vlastní odměna. Prázdný řetězec ji odebere. */
  rewardText: z.string().max(300).optional(),
  /** Milník je dosažený. */
  achieved: z.boolean().optional(),
  /** Odměna je vybraná. */
  claimed: z.boolean().optional(),
});

/** Úprava milníku: odměna, dosažení, vyzvednutí odměny. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const milestone = await db.milestone.findFirst({
    where: { id, goal: { userId: guard.user.id } },
    select: { id: true },
  });
  if (!milestone) {
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

  const data: Record<string, unknown> = {};

  if (parsed.data.rewardText !== undefined) {
    const text = parsed.data.rewardText.trim();
    data.rewardText = text || null;
    // Jakmile do odměny sáhne uživatel, přestává být návrhem od AI.
    data.rewardSource = text ? "USER" : null;
  }

  if (parsed.data.achieved !== undefined) {
    data.achievedAt = parsed.data.achieved ? new Date() : null;
    // Nedosažený milník nemá vybranou odměnu — jinak by po zrušení
    // dosažení zůstal ve stavu, který nedává smysl.
    if (!parsed.data.achieved) data.rewardClaimed = false;
  }

  if (parsed.data.claimed !== undefined) {
    data.rewardClaimed = parsed.data.claimed;
  }

  await db.milestone.update({ where: { id: milestone.id }, data });

  return NextResponse.json({ ok: true });
}
