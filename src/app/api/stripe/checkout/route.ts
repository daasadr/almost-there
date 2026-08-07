import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe/client";
import { isBillingPeriod, stripePriceId } from "@/lib/stripe/plans";
import { routing, type Locale } from "@/i18n/routing";

export const runtime = "nodejs";

/**
 * Zahájení platby. Vrací adresu platební stránky, na kterou klient přesměruje.
 *
 * Používáme Managed Payments — Stripe je právním prodejcem a přebírá DPH,
 * reklamace i podvodné platby. Integrace je jinak standardní Checkout.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const { period, locale: rawLocale } = body as {
    period?: unknown;
    locale?: unknown;
  };

  if (!isBillingPeriod(period)) {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const locale: Locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .replace(/\/+$/, "");

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      // Stripe jako právní prodejce (merchant of record).
      managed_payments: { enabled: true },
      line_items: [{ price: stripePriceId(period), quantity: 1 }],

      // Zákazníka párujeme přes uložené ID, jinak přes e-mail. Bez toho by
      // každá platba založila ve Stripu nového zákazníka.
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email }),

      // Podle čeho webhook pozná, komu předplatné patří. Na e-mail se
      // spolehnout nejde — uživatel si ho může u pokladny změnit.
      client_reference_id: user.id,
      subscription_data: {
        metadata: { userId: user.id },
      },
      metadata: { userId: user.id },

      success_url: `${base}/${locale}/app?checkout=success`,
      cancel_url: `${base}/${locale}/app?checkout=cancelled`,
    });

    if (!checkout.url) {
      return NextResponse.json({ ok: false, error: "generic" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, url: checkout.url });
  } catch (error) {
    console.error("[stripe] vytvoření platby selhalo", error);
    return NextResponse.json({ ok: false, error: "generic" }, { status: 502 });
  }
}
