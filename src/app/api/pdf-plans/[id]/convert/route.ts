import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAccess } from "@/lib/billing/access";
import {
  AlreadyConvertedError,
  convertToGoal,
  PlanNotReadyError,
} from "@/lib/pdf-plans/convert";

export const runtime = "nodejs";

/**
 * Převod koupeného plánu na skutečný cíl.
 *
 * Jen pro předplatitele: právě tím se liší vytištěný snímek od živého
 * plánu, který se odškrtává a přepočítává. Model se nevolá, takže je
 * to rychlé a nic to nestojí — plán už existuje.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { hasAccess } = await getAccess(
    session.user.id,
    session.user.issuedAt,
  );
  if (!hasAccess) {
    return NextResponse.json(
      { ok: false, error: "notSubscribed" },
      { status: 402 },
    );
  }

  const { id } = await params;

  try {
    const goalId = await convertToGoal(id, session.user.id);
    return NextResponse.json({ ok: true, goalId });
  } catch (error) {
    // Dvojí klepnutí nebo dvě otevřené záložky. Uživatel se nemá
    // dozvědět, že „se to nepovedlo“ — cíl existuje.
    if (error instanceof AlreadyConvertedError) {
      return NextResponse.json(
        { ok: false, error: "alreadyConverted" },
        { status: 409 },
      );
    }
    if (error instanceof PlanNotReadyError) {
      return NextResponse.json({ ok: false, error: "notReady" }, { status: 409 });
    }

    console.error("[pdf-plans] převod na cíl selhal", id, error);
    return NextResponse.json({ ok: false, error: "generic" }, { status: 500 });
  }
}
