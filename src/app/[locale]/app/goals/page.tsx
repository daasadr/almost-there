import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AppNav } from "@/components/plan/AppNav";
import { GoalList } from "@/components/plan/GoalList";
import { getAccess } from "@/lib/billing/access";
import { listGoals } from "@/lib/goals/queries";

/**
 * Přehled běžících cílů.
 *
 * Dřív visel pod denním plánem. Ukazatele postupu jsou užitečné, ale
 * dívá se na ně člověk jednou za čas — a kdo se k nim prorolloval přes
 * celý dnešek, měl pocit, že tam nepatří. Vlastní stránka jim vrací
 * smysl a zároveň dává jasnou odpověď na otázku, kde hledat rozpis
 * cíle na měsíce a týdny: přes cíl, ne přes dnešek.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plan.goals" });
  return {
    title: `${t("title")} — AlmostThere`,
    robots: { index: false, follow: false },
  };
}

export default async function GoalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const { hasAccess, revoked } = await getAccess(
    session.user.id,
    session.user.issuedAt,
  );
  if (revoked) redirect(`/${locale}/login`);

  // Bez předplatného tu není co ukázat a paywall stojí na dnešku.
  if (!hasAccess) redirect(`/${locale}/app`);

  const t = await getTranslations({ locale, namespace: "plan.goals" });
  const goals = await listGoals(session.user.id);

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <AppNav />

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="display text-3xl">{t("title")}</h1>
        {goals.length > 0 && (
          <Link
            href={`/${locale}/app/goals/new`}
            className="text-sm font-medium text-[var(--color-lime-soft)] hover:underline"
          >
            {t("create")}
          </Link>
        )}
      </div>

      <div className="mt-6">
        <GoalList goals={goals} locale={locale} />
      </div>
    </section>
  );
}
