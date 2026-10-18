import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Zařízení, na kterých má přihlášený uživatel aktivovaný Vision Board.
 *
 * Čte se z prohlížeče, ne ze stránky. Stránka Extra je veřejná a
 * generuje se při sestavení; kdyby se na ní sáhlo na přihlášení,
 * musela by se vykreslovat při každém požadavku a zdražila by pro
 * všechny kvůli oddílu, který se týká přihlášených.
 *
 * Nepřihlášenému se odpovídá `signedIn: false`, ne chybou 401. Pro
 * veřejnou stránku to není porucha, jen jiný stav — a komponenta
 * podle toho pozná, jestli má mlčet, nebo ukázat prázdný seznam.
 *
 * Nárok na licenci má každý registrovaný účet, placený i neplacený,
 * takže se tu nekontroluje předplatné. Jen přihlášení.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ signedIn: false, devices: [] });
  }

  const devices = await db.visionBoardInstallation.findMany({
    where: { userId: session.user.id, deactivatedAt: null },
    orderBy: { activatedAt: "desc" },
    select: {
      id: true,
      platform: true,
      activatedAt: true,
      lastRenewedAt: true,
    },
  });

  return NextResponse.json({ signedIn: true, devices });
}
