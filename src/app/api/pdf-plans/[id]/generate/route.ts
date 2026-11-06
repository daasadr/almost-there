import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runRound } from "@/lib/pdf-plans/generate";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Jedno kolo výroby zaplaceného plánu.
 *
 * Klient volá dokola, dokud nepřijde `done`. Jedno volání modelu na
 * požadavek — dvanáctitýdenní plán je třináct kol a v jednom
 * požadavku by běžel minuty, takže by ho proxy utnula dřív, než by
 * doběhl.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await runRound(id, session.user.id);

  if (!result.ok) {
    // Cizí objednávka i neexistující dávají totéž: cizí se nemá
    // dozvědět, že existuje.
    const status =
      result.error === "notFound" ? 404 : result.error === "notPaid" ? 402 : 502;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    done: result.done,
    progress: result.progress,
  });
}
