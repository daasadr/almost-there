import { NextResponse } from "next/server";
import { z } from "zod";
import { hasLocale } from "next-intl";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { todayIso } from "@/lib/plan/calendar";
import { templateById } from "@/content/pdf-plans";
import { checkDraft, TEXT_MAX, TITLE_MAX } from "@/lib/pdf-plans/order";
import { CURRENCY, priceFor, toCrowns } from "@/lib/pdf-plans/pricing";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";

const HOUR_MS = 60 * 60 * 1000;
/** Kolik rozdělaných objednávek za hodinu. Nedokončené se nemažou. */
const ORDERS_PER_HOUR = 10;

/**
 * Tělo nese zadání, **nikdy ne cenu ani počet týdnů**.
 *
 * Obojí se dopočítá na serveru z termínu. Kdyby cena přišla
 * z prohlížeče, dala by se přepsat na korunu — a poznalo by se to
 * až na výpisu z účtu.
 */
const bodySchema = z.object({
  title: z.string().min(1).max(TITLE_MAX + 100),
  description: z.string().max(TEXT_MAX + 100).optional(),
  startingPoint: z.string().max(TEXT_MAX + 100).optional(),
  templateId: z.string().max(64).optional(),
  hoursPerWeek: z.number(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consent: z.boolean(),
  locale: z.enum(routing.locales),
});

/** Objednávka jednorázového plánu v PDF: založí ji a pošle k pokladně. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const limit = checkRateLimit(
    `pdf-plan:${session.user.id}`,
    ORDERS_PER_HOUR,
    HOUR_MS,
  );
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "tooMany" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const { locale } = parsed.data;
  if (!hasLocale(routing.locales, locale)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, timezone: true, stripeCustomerId: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Šablona se bere z našeho katalogu podle id, ne z těla požadavku.
  // Pokyny pro model jsou to, co plán odlišuje — podvržené by znamenaly
  // plán na cokoliv za cenu, která k tomu nepatří.
  const template = parsed.data.templateId
    ? templateById(parsed.data.templateId)
    : undefined;
  if (parsed.data.templateId && !template) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const startIso = todayIso(user.timezone);

  const draft = {
    title: parsed.data.title,
    description: parsed.data.description,
    startingPoint: parsed.data.startingPoint,
    templateId: template?.id,
    hoursPerWeek: parsed.data.hoursPerWeek,
    startIso,
    targetIso: parsed.data.targetDate,
    consent: parsed.data.consent,
  };

  const checked = checkDraft(draft);
  if (!checked.ok) {
    return NextResponse.json({ ok: false, error: checked.error }, { status: 400 });
  }

  const amountMinor = priceFor(checked.weeks);

  const order = await db.pdfPlan.create({
    data: {
      userId: user.id,
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      startingPoint: draft.startingPoint?.trim() || null,
      templateId: template?.id ?? null,
      weeks: checked.weeks,
      hoursPerWeek: draft.hoursPerWeek,
      locale,
      startDate: new Date(`${startIso}T00:00:00Z`),
      targetDate: new Date(`${parsed.data.targetDate}T00:00:00Z`),
      amountMinor,
      currency: CURRENCY,
      // Souhlas padl před platbou; ukládá se s časem kvůli případnému
      // sporu o právo na odstoupení.
      consentedAt: new Date(),
    },
    select: { id: true },
  });

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .replace(/\/+$/, "");

  try {
    const checkout = await getStripe().checkout.sessions.create({
      // `payment`, ne `subscription` — tohle je jednorázový nákup.
      // Webhook se podle toho rozhoduje, kterou větví jít.
      mode: "payment",
      currency: CURRENCY,
      managed_payments: { enabled: true },

      /*
       * Cena se skládá tady, ne z katalogu ve Stripu. Pásem je sice
       * jen pár, ale ceníky ve Stripu a v kódu by se časem rozešly
       * a zákazník by u pokladny viděl jinou částku než na stránce.
       */
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: amountMinor,
            product_data: {
              name: `Plán na ${checked.weeks} týdnů v PDF`,
              description: draft.title.trim().slice(0, 300),
            },
          },
        },
      ],

      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email }),

      client_reference_id: user.id,
      // Podle tohohle webhook pozná, kterou objednávku zaplatil.
      metadata: { userId: user.id, pdfPlanId: order.id },

      success_url: `${base}/${locale}/app/pdf-plans/${order.id}`,
      cancel_url: `${base}/${locale}/pdf-plans?checkout=cancelled`,
    });

    if (!checkout.url) {
      return NextResponse.json({ ok: false, error: "generic" }, { status: 502 });
    }

    await db.pdfPlan.update({
      where: { id: order.id },
      data: { stripeSessionId: checkout.id },
    });

    return NextResponse.json({
      ok: true,
      url: checkout.url,
      amount: toCrowns(amountMinor),
    });
  } catch (error) {
    console.error("[pdf-plans] vytvoření platby selhalo", error);
    return NextResponse.json({ ok: false, error: "generic" }, { status: 502 });
  }
}
