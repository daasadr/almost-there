import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";

/**
 * Zapamatování jazyka účtu.
 *
 * Volá se, když přihlášený uživatel přepne jazyk v hlavičce. Bez toho zná
 * aplikace jazyk jen z adresy, kterou si e-mail nepřečte — potvrzení
 * registrace ani obnova hesla by pak nechodily v jazyce, ve kterém člověk
 * aplikaci používá. Účty z Googlu zakládá adaptér a jazyk u nich zůstává
 * na výchozím, takže tohle je jediná cesta, jak se ho dozvědět.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { locale } = body as { locale?: unknown };
  if (!hasLocale(routing.locales, locale)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { locale },
  });

  return NextResponse.json({ ok: true });
}
