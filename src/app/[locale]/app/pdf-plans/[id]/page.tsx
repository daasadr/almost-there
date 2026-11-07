import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PlanProgress } from "@/components/pdf-plans/PlanProgress";
import { ConvertToGoal } from "@/components/pdf-plans/ConvertToGoal";
import { getAccess } from "@/lib/billing/access";
import { isComplete, parsePlan, progress } from "@/lib/pdf-plans/plan";

/**
 * Zakoupený plán: po zaplacení sem vede pokladna.
 *
 * Tři stavy, které se liší tím, co má člověk dělat:
 *
 *  - čeká se na potvrzení platby — nic, jen chvíli počkat,
 *  - vyrábí se — taky nic, ale musí být vidět, že se něco děje,
 *  - hotovo — stáhnout.
 *
 * Výroba se spouští odtud, ne z webhooku od Stripu. Ten musí
 * odpovědět hned, jinak ho Stripe pošle znovu a plán by vznikl
 * dvakrát.
 */

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PdfPlanPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  // Vlastnictví je součástí dotazu. Cizí plán tak vypadá stejně
  // jako neexistující a nedá se podle odpovědi hádat.
  const order = await db.pdfPlan.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      status: true,
      planJson: true,
      weeks: true,
      goalId: true,
    },
  });
  if (!order) notFound();

  const t = await getTranslations({ locale, namespace: "pdfPlans" });
  const plan = parsePlan(order.planJson);
  const ready = order.status === "READY" && plan && isComplete(plan);

  /*
   * Nabídka převodu patří jen předplatitelům. Nabízet ji ostatním by
   * znamenalo ukázat něco, co si nemůžou vzít — a hned vedle toho
   * prosit o předplatné, což je přesně ten nátlak, kterému se tu
   * vyhýbáme. Kdo ho nemá, vidí plán a nic víc.
   */
  const { hasAccess } = await getAccess(
    session.user.id,
    session.user.issuedAt,
  );

  return (
    <section className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="display text-2xl leading-tight sm:text-3xl">
        {order.title}
      </h1>

      {order.status === "AWAITING_PAYMENT" ? (
        <div className="card mt-8 p-5 sm:p-6">
          <h2 className="display text-lg">{t("awaitingTitle")}</h2>
          <p className="mt-2 text-base leading-relaxed text-[var(--color-paper-dim)]">
            {t("awaitingBody")}
          </p>
        </div>
      ) : ready ? (
        <div className="card mt-8 p-5 sm:p-6">
          <h2 className="display text-lg">{t("readyTitle")}</h2>
          <p className="mt-2 text-base leading-relaxed text-[var(--color-paper-dim)]">
            {t("readyBody")}
          </p>
          <a
            href={`/api/pdf-plans/${order.id}/pdf`}
            className="btn-primary mt-4 inline-flex"
          >
            {t("download")}
          </a>
        </div>
      ) : (
        <PlanProgress
          planId={order.id}
          initial={
            plan ? progress(plan) : { done: 0, total: order.weeks }
          }
        />
      )}

      {ready && hasAccess && (
        <ConvertToGoal planId={order.id} goalId={order.goalId} />
      )}

      <p className="mt-8 text-sm">
        <Link
          href={`/${locale}/app/goals`}
          className="text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
        >
          ← {t("metaTitle")}
        </Link>
      </p>
    </section>
  );
}
