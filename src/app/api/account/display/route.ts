import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Předvolby vzhledu.
 *
 * Schválně mimo `/api/account/preferences`. Tam se nastavuje, jak se má
 * plánovat — denní kapacita, volno, ohlédnutí — a mění se to celé
 * najednou formulářem v nastavení. Tohle jsou přepínače, které se cvakají
 * jednotlivě a přímo tam, kde je jejich účinek vidět; kdyby šly stejnou
 * cestou, musel by přepínač u obrázků posílat i denní kapacitu.
 *
 * Do plánování nevstupuje nic z toho, takže ani nemá smysl kvůli tomu
 * cokoliv přepočítávat.
 */

const bodySchema = z.object({
  /** Mají motivační obrázky viset pod seznamem úkolů místo nad ním? */
  imagesBelowTasks: z.boolean(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
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

  await db.user.update({
    where: { id: session.user.id },
    data: { imagesBelowTasks: parsed.data.imagesBelowTasks },
  });

  return NextResponse.json({ ok: true });
}
