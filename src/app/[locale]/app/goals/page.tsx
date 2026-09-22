import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
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
  const ts = await getTranslations({ locale, namespace: "plan.settings" });

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="display text-3xl">{t("title")}</h1>
        <Link
          href={`/${locale}/app/goals/new`}
          className="btn-primary !px-5 !py-2 text-sm"
        >
          {t("create")}
        </Link>
      </div>

      {/*
        Nastavení patří sem, nad cíle.

        Denní kapacita, odpočinek, časové pásmo a odměny nejsou předvolby
        vzhledu — z nich se staví každý plán a špatně vyplněné se do něj
        propíšou úplně všude. Viselo to pod položkou „Jak plánovat“ vedle
        „Návodu“, kde to vypadalo jako další stránka s vysvětlováním,
        a nikdo to nenašel. Tady se o to zavadí cestou k cílům, kterých
        se to týká.
      */}
      <Link
        href={`/${locale}/app/settings`}
        className="card card-hover mt-6 flex items-start gap-4 p-5"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 text-xl leading-none text-[var(--color-accent)]"
        >
          ⚙
        </span>
        <span className="min-w-0">
          <span className="display block text-base">{ts("title")}</span>
          <span className="mt-1 block text-sm leading-relaxed text-[var(--color-paper-dim)]">
            {ts("subtitle")}
          </span>
        </span>
      </Link>

      <div className="mt-6">
        <GoalList goals={goals} locale={locale} />
      </div>
    </section>
  );
}
