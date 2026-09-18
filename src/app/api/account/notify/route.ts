import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Nastavení připomínek. Mimo plánovací předvolby — do plánu nevstupuje. */
const bodySchema = z.object({
  mode: z.enum(["OFF", "DAILY", "WEEKLY"]),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  evening: z.boolean(),
});

export async function PATCH(request: Request) {
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

  await db.user.update({
    where: { id: session.user.id },
    data: {
      notifyMode: parsed.data.mode,
      notifyTime: parsed.data.time,
      notifyEvening: parsed.data.evening,
      // Změna nastavení ruší odklad i dnešní značku — kdo si právě
      // připomínky zapnul, má je dostat dnes, ne až zítra.
      notifySnoozedUntil: null,
      notifiedOn: null,
    },
  });

  return NextResponse.json({ ok: true });
}
