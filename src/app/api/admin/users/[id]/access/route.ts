import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";

export const runtime = "nodejs";

const bodySchema = z.object({
  grant: z.boolean(),
  /** Proč. U přidělení povinné, ať se za rok pozná, komu a nač. */
  note: z.string().max(200).optional(),
  /** Do kdy platí, YYYY-MM-DD. Bez data platí bez omezení. */
  until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Přidělení nebo odebrání bezplatného přístupu.
 *
 * Limity použití se tím nemění — bezplatný účet má stejný měsíční strop
 * jako placený. Rozdíl je jen v tom, že za něj nikdo neplatí.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
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

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      subscriptionSource: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
    },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  // Nesahá se do předplatného, které právě běží. Přepsat ho ručně by
  // znamenalo, že aplikace tvrdí něco jiného než Stripe, a nejbližší
  // webhook by to stejně vrátil zpátky.
  //
  // Skončené předplatné ale překáží nemá: zrušenému zákazníkovi musí jít
  // přidělit přístup, jinak by po zrušení zůstal zamčený navždy.
  const hasLivePaidSubscription =
    user.stripeSubscriptionId !== null &&
    ["ACTIVE", "TRIAL", "PAST_DUE"].includes(user.subscriptionStatus);

  if (hasLivePaidSubscription) {
    return NextResponse.json(
      { ok: false, error: "hasPaidSubscription" },
      { status: 409 },
    );
  }

  if (parsed.data.grant) {
    const note = parsed.data.note?.trim();
    if (!note) {
      return NextResponse.json(
        { ok: false, error: "noteRequired" },
        { status: 400 },
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionSource: "COMPLIMENTARY",
        subscriptionNote: note,
        subscriptionEndsAt: parsed.data.until
          ? new Date(`${parsed.data.until}T23:59:59Z`)
          : null,
      },
    });

    console.log(
      `[admin] ${guard.admin.email} přidělil bezplatný přístup uživateli ${user.id} (${note})`,
    );

    return NextResponse.json({ ok: true });
  }

  // Odebrat jde jen to, co jsme sami přidělili.
  if (user.subscriptionSource !== "COMPLIMENTARY") {
    return NextResponse.json(
      { ok: false, error: "notComplimentary" },
      { status: 409 },
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "NONE",
      subscriptionSource: null,
      subscriptionNote: null,
      subscriptionEndsAt: null,
    },
  });

  console.log(
    `[admin] ${guard.admin.email} odebral bezplatný přístup uživateli ${user.id}`,
  );

  return NextResponse.json({ ok: true });
}
