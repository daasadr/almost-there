import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";

export const runtime = "nodejs";

/**
 * Odbavení hlášení: označit za vyřízené, nebo vrátit mezi nová.
 *
 * `requireAdmin` vrací u cizího 404, ne 403 — neprozrazuje tím, že
 * takový koncový bod vůbec existuje.
 */
const bodySchema = z.object({
  id: z.string().min(1).max(64),
  done: z.boolean(),
});

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // `updateMany`, ne `update`: neexistující id tak neskončí výjimkou,
  // jen nulou změněných řádků. Tady se nic neztratí ani nerozbije.
  await db.feedback.updateMany({
    where: { id: parsed.data.id },
    data: { status: parsed.data.done ? "DONE" : "NEW" },
  });

  return NextResponse.json({ ok: true });
}
