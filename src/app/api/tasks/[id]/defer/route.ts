import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { parseIsoDate, todayIso } from "@/lib/plan/calendar";

export const runtime = "nodejs";

/**
 * Odložení úkolu na jindy.
 *
 * Plán vzniká jednou a nemůže vědět o věcech, které stojí mimo něj — že
 * zrovna nejsou peníze na zkoušku, že se instruktor rozstonal, že prší.
 * Bez téhle možnosti zbývají uživateli dvě špatné cesty: odškrtnout
 * nesplněné, nebo nechat úkol propadnout.
 *
 * To první je horší, a ne jen morálně. Podle odškrtaných dní se počítá
 * tempo a podle tempa se nabízí dohnání skluzu nebo posun termínu. Jedno
 * falešné zaškrtnutí se do toho propíše a aplikace pak s klidem tvrdí,
 * že stíháš.
 *
 * Úkol se nevyměňuje ani negeneruje nový. Zaplatit zkoušku pořád musíš,
 * jen ne dnes — jde o tentýž úkol v jiný den.
 */

const bodySchema = z.object({
  /**
   * Na kdy. `null` znamená „nevím kdy“ — úkol jde stranou a čeká, dokud
   * mu uživatel datum nedá. Do denního výhledu se pak neplete.
   */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  /** Proč to nešlo. Vlastními slovy, nepovinné. */
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  const { id } = await params;

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

  const task = await db.task.findFirst({
    where: { id, goal: { userId: guard.user.id } },
    select: { id: true, status: true },
  });

  if (!task) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  // Hotový úkol odkládat nedává smysl a nejspíš je to překlep v rozhraní.
  if (task.status === "DONE") {
    return NextResponse.json(
      { ok: false, error: "alreadyDone" },
      { status: 409 },
    );
  }

  const { date, reason } = parsed.data;

  if (date) {
    // Do minulosti se odkládat nedá — úkol by rovnou spadl mezi zmeškané
    // a uživatel by nechápal, proč se mu hned vrátil.
    const today = todayIso(guard.user.timezone);
    if (date < today) {
      return NextResponse.json(
        { ok: false, error: "pastDate" },
        { status: 400 },
      );
    }
  }

  await db.task.update({
    where: { id: task.id },
    data: {
      deferredTo: date ? parseIsoDate(date) : null,
      // Bez data jde úkol stranou; s datem zůstává čekat na svůj den.
      status: date ? "PENDING" : "DEFERRED",
      deferReason: reason?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}
