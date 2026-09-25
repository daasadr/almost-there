import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DEFAULT_THEME, THEMES } from "@/lib/theme";

export const runtime = "nodejs";

/**
 * Přihlášení zařízení k odběru oznámení.
 *
 * Prohlížeč si vyrobí vlastní adresu u své poštovní služby a pár klíčů;
 * my si je uložíme, abychom měli kam a čím posílat. Jeden člověk jich má
 * klidně několik — počítač v práci, notebook doma, telefon.
 */

const bodySchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
  /**
   * Vzhled zvolený na tomhle zařízení. Podle něj se vybírá ikona
   * a obrázek do oznámení.
   *
   * Nepovinný: starší verze aplikace ho neposílá a odběr se kvůli tomu
   * nemá odmítnout. Bez něj zůstane, co u odběru je.
   */
  theme: z.enum(THEMES).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
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

  const { endpoint, keys, theme } = parsed.data;

  /*
   * Podle adresy, ne podle uživatele.
   *
   * Prohlížeč si adresu drží a po odhlášení a přihlášení jiného účtu
   * pošle tutéž. Bez přepsání vlastníka by oznámení chodila původnímu
   * člověku na cizí zařízení.
   */
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      theme: theme ?? DEFAULT_THEME,
    },
    update: {
      userId: session.user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
      lastSeenAt: new Date(),
      // Bez motivu v zásilce zůstane, co u odběru je.
      ...(theme ? { theme } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

/** Odhlášení zařízení — uživatel si připomínky vypnul nebo odvolal svolení. */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let endpoint: string | undefined;
  try {
    endpoint = (await request.json())?.endpoint;
  } catch {
    // Bez těla se smažou všechna zařízení toho člověka.
  }

  await db.pushSubscription.deleteMany({
    where: endpoint
      ? { endpoint, userId: session.user.id }
      : { userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
