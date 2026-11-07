import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";

/**
 * Zakoupené plány v PDF v seznamu cílů.
 *
 * Vlastní oddíl, ne položky mezi cíli. Koupený plán **není běžící
 * cíl**: neodškrtává se, nepřepočítává a nepočítá se do limitu pěti
 * běžících. Kdyby ležel mezi nimi, sliboval by chování, které nemá —
 * a první klepnutí by zklamalo.
 *
 * Nevykreslí se, dokud něco není. Prázdný nadpis „Koupené plány" by
 * drtivé většině lidí jen říkal, že si něco nekoupili.
 */
export async function PurchasedPlans({
  userId,
  locale,
}: {
  userId: string;
  locale: string;
}) {
  const plans = await db.pdfPlan.findMany({
    where: {
      userId,
      // Nezaplacené objednávky sem nepatří: vznikají i tím, že někdo
      // otevře pokladnu a zavře ji, a seznam nedokončených nákupů
      // nikomu nepomůže.
      status: { not: "AWAITING_PAYMENT" },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      weeks: true,
      targetDate: true,
    },
  });

  if (plans.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "pdfPlans" });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <section className="mt-12">
      <h2 className="display text-xl">{t("listTitle")}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-faint)]">
        {t("listNote")}
      </p>

      <ul className="mt-4 space-y-3">
        {plans.map((plan) => (
          <li key={plan.id}>
            <Link
              href={`/app/pdf-plans/${plan.id}`}
              className="card card-hover block p-4 sm:p-5"
            >
              <span className="block text-base font-medium text-[var(--color-paper)]">
                {plan.title}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[var(--color-paper-faint)]">
                <span>{t("listWeeks", { weeks: plan.weeks })}</span>
                <span>{date.format(plan.targetDate)}</span>
                {plan.status !== "READY" && (
                  <span className="text-[var(--color-paper-dim)]">
                    {plan.status === "FAILED"
                      ? t("listFailed")
                      : t("listWorking")}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
