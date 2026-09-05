import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { AppNav } from "@/components/plan/AppNav";
import { GoalList } from "@/components/plan/GoalList";
import { FreeAccountNotice } from "@/components/billing/FreeAccountNotice";
import { getAccess } from "@/lib/billing/access";
import { listGoals } from "@/lib/goals/queries";
import { isStoreApp } from "@/lib/store-app";

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

  const t = await getTranslations({ locale, namespace: "plan.goals" });

  /**
   * Bez předplatného se dřív mlčky přesměrovávalo na dnešek. Kdo v menu
   * klikl na „Cíle“, skončil zpátky na dnešku bez jediného slova a
   * záložka vypadala rozbitě. Teď se stránka ukáže i jemu, jen místo
   * seznamu vysvětlí, proč je prázdná.
   */
  if (!hasAccess) {
    const tb = await getTranslations({ locale, namespace: "billing" });
    return (
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <AppNav />
        <h1 className="display mt-8 text-3xl">{t("title")}</h1>
        <FreeAccountNotice
          locale={locale}
          storeApp={isStoreApp(await headers())}
          reason={tb("freeGoalsReason")}
        />
      </section>
    );
  }

  const goals = await listGoals(session.user.id);

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <AppNav />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="display text-3xl">{t("title")}</h1>
        <Link
          href={`/${locale}/app/goals/new`}
          className="btn-primary !px-5 !py-2 text-sm"
        >
          {t("create")}
        </Link>
      </div>

      <div className="mt-6">
        <GoalList goals={goals} locale={locale} />
      </div>
    </section>
  );
}
