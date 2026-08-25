import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { CancelSubscription } from "@/components/billing/CancelSubscription";
import { AppNav } from "@/components/plan/AppNav";
import { UsageMeter } from "@/components/plan/UsageMeter";
import { isAdminEmail } from "@/lib/admin/guard";
import { getAccess } from "@/lib/billing/access";
import { db } from "@/lib/db";

/**
 * Účet: co uživatel platí, kolik spotřeboval a jak odejít.
 *
 * Dřív to viselo pod denním plánem, kam se nikdo nescrolloval a kde to
 * působilo nepatřičně. Vlastní stránka je struktura, kterou lidé znají
 * odjinud a čekají ji.
 *
 * Dostupná i bez předplatného — právě tady se dá zjistit, co se s účtem
 * děje, a odhlásit se.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.app" });
  return {
    title: `${t("accountTitle")} — AlmostThere`,
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "auth.app" });
  const tPlan = await getTranslations({ locale, namespace: "plan.nav" });

  const { status, hasAccess, revoked } = await getAccess(
    session.user.id,
    session.user.issuedAt,
  );
  if (revoked) redirect(`/${locale}/login`);

  const billing = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      stripeSubscriptionId: true,
      subscriptionEndsAt: true,
      subscriptionCancelAtPeriodEnd: true,
    },
  });

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <AppNav />

      <h1 className="display mt-8 text-3xl">{t("accountTitle")}</h1>

      <div className="card mt-6 p-6 sm:p-8">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--color-paper-faint)]">
              {t("accountEmail")}
            </dt>
            <dd className="mt-1 text-[var(--color-paper)]">
              {session.user.email}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-paper-faint)]">
              {t("accountPlan")}
            </dt>
            <dd className="mt-1 text-[var(--color-paper)]">
              {t(`plan.${status}`)}
            </dd>
          </div>
        </dl>

        {hasAccess && (
          <div className="mt-7 border-t border-white/5 pt-6 text-sm">
            <UsageMeter userId={session.user.id} locale={locale} />
          </div>
        )}

        {/* Zrušit předplatné musí jít z aplikace, ne jen ve Stripu.
            U přiděleného přístupu není co vypovídat. */}
        {billing?.stripeSubscriptionId && (
          <div className="mt-7 border-t border-white/5 pt-6">
            <CancelSubscription
              endsAt={billing.subscriptionEndsAt?.toISOString() ?? null}
              cancelAtPeriodEnd={billing.subscriptionCancelAtPeriodEnd}
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-6">
        <SignOutButton label={t("signOut")} />

        <Link
          href={`/${locale}/app/settings`}
          className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
        >
          {tPlan("settings")}
        </Link>

        {/* Návod patří i sem, ne jen do patičky webu. Kdo si něčím není
            jistý, hledá pomoc v aplikaci, ne na úvodní stránce. */}
        <Link
          href={`/${locale}/guide`}
          className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
        >
          {tPlan("guide")}
        </Link>

        {/* Odkaz vidí jen správce. Stránka si oprávnění stejně ověřuje
            sama — tohle je pohodlí, ne ochrana. */}
        {isAdminEmail(session.user.email) && (
          <Link
            href={`/${locale}/admin`}
            className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
          >
            Správa uživatelů
          </Link>
        )}
      </div>
    </section>
  );
}
