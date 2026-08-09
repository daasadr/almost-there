import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe/client";

export const runtime = "nodejs";

const bodySchema = z.object({
  /** `false` vypovězení odvolá, dokud předplatné ještě běží. */
  cancel: z.boolean(),
});

/**
 * Výpověď předplatného ze strany zákazníka.
 *
 * Ruší se ke konci zaplaceného období, ne okamžitě — za období už zaplatil
 * a ukrojit mu ho by bylo nefér i právně sporné. Do té doby může výpověď
 * vzít zpátky.
 *
 * Stav se nemění tady, jen ve Stripu. Zapíše ho až webhook — je to jediné
 * místo, kde se stav předplatného upravuje, a dvě cesty k témuž údaji by
 * se dřív nebo později rozešly.
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
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeSubscriptionId: true },
  });

  if (!user?.stripeSubscriptionId) {
    // Přidělený bezplatný přístup se takhle zrušit nedá — není co vypovědět.
    return NextResponse.json(
      { ok: false, error: "noSubscription" },
      { status: 409 },
    );
  }

  try {
    await getStripe().subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: parsed.data.cancel,
    });

    // Webhook dorazí za okamžik, ale uživatel se dívá teď. Zapsat tenhle
    // jeden příznak rovnou je bezpečné: nemění přístup, jen to, co stránka
    // ukazuje, a webhook ho vzápětí potvrdí.
    await db.user.update({
      where: { id: session.user.id },
      data: { subscriptionCancelAtPeriodEnd: parsed.data.cancel },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[stripe] výpověď předplatného selhala", error);
    return NextResponse.json({ ok: false, error: "generic" }, { status: 502 });
  }
}
