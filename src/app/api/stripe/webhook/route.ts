import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe/client";
import type { SubscriptionStatus } from "@/generated/prisma";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { buildPurchaseConfirmationEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

/**
 * Webhook od Stripu — jediné místo, kde se mění stav předplatného.
 *
 * Zásadní: stav NIKDY neurčujeme podle toho, že se uživatel vrátil na
 * stránku „platba proběhla". Tu adresu si může kdokoliv otevřít sám.
 * Platí jen to, co přijde sem s platným podpisem od Stripu.
 */

/** Převod stavu ze Stripu na náš. Neznámé stavy bereme jako neplatící. */
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIAL";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "NONE";
  }
}

/**
 * Najde uživatele, kterému předplatné patří. Pořadí není náhodné —
 * metadata jsou nejspolehlivější, e-mail nejméně (uživatel si ho může
 * u pokladny změnit a trefil by cizí účet).
 */
async function findUserId(
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const fromMetadata = subscription.metadata?.userId;
  if (fromMetadata) return fromMetadata;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function applySubscription(subscription: Stripe.Subscription) {
  const userId = await findUserId(subscription);
  if (!userId) {
    console.error(
      "[stripe] předplatné bez přiřaditelného uživatele:",
      subscription.id,
    );
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // Konec období bereme z položky předplatného — od novějších verzí API
  // už není na samotném předplatném.
  const periodEnd = subscription.items.data[0]?.current_period_end;

  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: mapStatus(subscription.status),
      subscriptionSource: "STRIPE",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionEndsAt: periodEnd ? new Date(periodEnd * 1000) : null,
      // Zákazník může vypovědět i přímo ve Stripu, ne jen v aplikaci —
      // pravdu má vždycky Stripe a tohle je místo, kde si ji bereme.
      subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    },
  });
}

/**
 * Potvrzení o souhlasu se zahájením plnění.
 *
 * Posílá se z webhooku, ne z pokladny: teprve tady je jisté, že platba
 * proběhla. Selhání odeslání nesmí shodit zpracování — předplatné už
 * platí a opakované doručení webhooku by pak zákazníka zahltilo.
 */
async function sendPurchaseConfirmation(
  subscription: Stripe.Subscription,
): Promise<void> {
  try {
    const userId = await findUserId(subscription);
    if (!userId) return;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, locale: true },
    });
    if (!user) return;

    const locale = hasLocale(routing.locales, user.locale)
      ? user.locale
      : routing.defaultLocale;

    const base = env.appUrl.replace(/\/+$/, "");
    const mail = await buildPurchaseConfirmationEmail(
      locale,
      `${base}/${locale}/withdrawal`,
    );

    await sendEmail({ to: user.email, ...mail });
  } catch (error) {
    console.error("[stripe] potvrzení o nákupu se nepodařilo odeslat", error);
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  // Podpis se ověřuje proti nezměněnému tělu požadavku — proto `text()`,
  // ne `json()`. Jakákoliv úprava by podpis rozbila.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    // Neplatný podpis = požadavek není od Stripu. Zahodit bez čtení obsahu.
    console.error("[stripe] neplatný podpis webhooku", error);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription" || !session.subscription) break;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

        // Načteme celé předplatné — session sama o sobě nenese stav ani
        // konec období, a ty potřebujeme.
        const subscription =
          await getStripe().subscriptions.retrieve(subscriptionId);

        // Uživatele si zapamatujeme z client_reference_id, pokud v metadatech
        // předplatného chybí (u některých toků se tam nepropíše).
        if (!subscription.metadata?.userId && session.client_reference_id) {
          subscription.metadata = {
            ...subscription.metadata,
            userId: session.client_reference_id,
          };
        }

        await applySubscription(subscription);
        await sendPurchaseConfirmation(subscription);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(event.data.object);
        break;
      }

      default:
        // Ostatní události nás nezajímají, ale musíme odpovědět 200,
        // jinak by je Stripe zkoušel doručovat znovu.
        break;
    }
  } catch (error) {
    // 500 znamená, že to Stripe zkusí znovu — což chceme, protože výpadek
    // databáze nesmí tiše shodit něčí předplatné.
    console.error("[stripe] zpracování události selhalo", event.type, error);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
