import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Uvolnění zařízení z účtu.
 *
 * Z webu, ne z aplikace — ta na to má vlastní cestu s licencí jako
 * průkazem. Tady je průkazem přihlášení.
 *
 * Zařízení se nemaže, jen označí za neaktivní. Kdyby záznam zmizel,
 * přišlo by se s ním o to, že se k témuž `installationId` nemá vydávat
 * nová licence — a odebrané zařízení by šlo oživit prostým zopakováním
 * aktivace, čímž by odebírání přestalo k něčemu být.
 *
 * Aplikace na tom zařízení si licenci ponechá až do konce platnosti.
 * Ověřuje se offline, takže se o odebrání nemá jak dozvědět dřív než
 * při obnově — a ta jí pak vrátí `revoked`. Je to daň za to, že Vision
 * Board funguje bez připojení.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // `userId` je v podmínce, ne v kontrole po načtení: cizí zařízení
  // tak neodebere ani někdo, kdo zná jeho id.
  const result = await db.visionBoardInstallation.updateMany({
    where: { id, userId: session.user.id, deactivatedAt: null },
    data: { deactivatedAt: new Date() },
  });

  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
