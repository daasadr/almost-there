import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";

export const runtime = "nodejs";

const bodySchema = z.object({
  /** Vlastní závěrečná odměna. Prázdný řetězec ji odebere. */
  rewardText: z.string().max(300).optional(),
  /** Odměna je vyzvednutá — člověk si ji dopřál. */
  claimed: z.boolean().optional(),
});

/**
 * Závěrečná odměna cíle.
 *
 * Záměrně oddělené od odměn za milníky, i když se chovají stejně.
 * Milník je řádek v plánu a může jich být patnáct; tahle odměna je
 * jedna a patří k cíli — kdyby visela na posledním milníku, zmizela by
 * při každém přeplánování spolu s ním.
 *
 * Dotažený cíl se smí měnit taky. Odměnu si člověk často vybere až
 * na oslavné stránce a odškrtne si ji ještě o den později.
 */
export async function PATCH(
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

  const data: Record<string, unknown> = {};

  if (parsed.data.rewardText !== undefined) {
    const text = parsed.data.rewardText.trim();
    data.finalRewardText = text || null;
    // Jakmile do odměny sáhne uživatel, přestává být návrhem od AI.
    data.finalRewardSource = text ? "USER" : null;
    // Odměna, kterou někdo právě přepsal, ještě není vyzvednutá.
    if (!text) data.finalRewardClaimed = false;
  }

  if (parsed.data.claimed !== undefined) {
    data.finalRewardClaimed = parsed.data.claimed;
  }

  await db.goal.update({ where: { id: goal.id }, data });

  return NextResponse.json({ ok: true });
}
