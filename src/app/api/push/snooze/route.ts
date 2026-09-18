import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SNOOZE_HOURS } from "@/lib/notify/dispatch";

export const runtime = "nodejs";

/**
 * „Připomeň později“ z oznámení.
 *
 * Časovač by měl držet service worker, jenže ten žije jen pár vteřin
 * a přes vypnutý prohlížeč nic neudrží. Odklad se proto zapisuje na
 * server, kde rozesílání stejně běží.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const until = new Date(Date.now() + SNOOZE_HOURS * 3_600_000);

  /*
   * Zároveň se maže značka dnešní připomínky.
   *
   * Bez toho by se za dvě hodiny nic neozvalo: rozesílač by viděl, že
   * dnes už šlo oznámení ven, a mlčel by. Odložit znamená poslat znovu,
   * ne odbýt.
   */
  await db.user.update({
    where: { id: session.user.id },
    data: { notifySnoozedUntil: until, notifiedOn: null },
  });

  return NextResponse.json({ ok: true });
}
