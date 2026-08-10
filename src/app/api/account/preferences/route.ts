import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Předvolby, ze kterých se staví každý plán.
 *
 * Do teď se braly výchozí hodnoty — hodina denně, jeden den odpočinku,
 * deset minut reflexe — a uživatel se na ně nikdy nedostal zeptat. Plán
 * se tak stavěl na čísle, které si nikdo nezvolil.
 */

const bodySchema = z.object({
  /** Kolik minut denně má uživatel na cíle dohromady. */
  dailyCapacityMinutes: z.number().int().min(15).max(600),
  reflectionMinutesDay: z.number().int().min(0).max(120),
  restFrequency: z.enum([
    "NONE",
    "ONE_DAY_PER_WEEK",
    "TWO_DAYS_PER_WEEK",
    "EVERY_OTHER_DAY",
  ]),
  timezone: z.string().min(1).max(64),
  /**
   * Co má uživatel rád a co ne. Vstupuje do návrhů odměn za milníky.
   *
   * Strop je štědrý, ale ne bezedný: text jde do promptu a platí se za
   * něj v tokenech. Prázdný řetězec se ukládá jako prázdno, aby se
   * v databázi nehromadily prázdné řetězce vedle NULL a nebylo pak
   * potřeba testovat obojí.
   */
  rewardLikes: z.string().max(600).optional(),
  rewardDislikes: z.string().max(600).optional(),
});

/** Ověření pásma proti systému, ne proti vlastnímu seznamu — ten by
 *  zastaral a odmítal by platná pásma. */
function isKnownTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
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

  if (!isKnownTimeZone(parsed.data.timezone)) {
    return NextResponse.json(
      { ok: false, error: "badTimezone" },
      { status: 400 },
    );
  }

  const { rewardLikes, rewardDislikes, ...rest } = parsed.data;

  await db.user.update({
    where: { id: session.user.id },
    data: {
      ...rest,
      // Vymazané políčko znamená prázdno, ne prázdný řetězec.
      rewardLikes: rewardLikes?.trim() || null,
      rewardDislikes: rewardDislikes?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}
