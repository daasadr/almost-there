import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Paywall } from "@/components/billing/Paywall";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.app" });
  return { title: `${t("title")} — AlmostThere` };
}

/**
 * Zatím rozcestí za přihlášením — potvrzuje, že celý tok funguje.
 * Sem přijde paywall a po něm zakládání cílů a denní checklist.
 */
export default async function AppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  // Middleware sem nepřihlášeného nepustí, tohle je druhá pojistka
  // pro případ, že by se sem někdy sáhlo jinou cestou.
  if (!session?.user) redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "auth.app" });

  // ACTIVE i TRIAL znamenají „má přístup". PAST_DUE ne — neuhrazená platba
  // nesmí držet přístup otevřený donekonečna.
  const hasSubscription = ["ACTIVE", "TRIAL"].includes(
    session.user.subscriptionStatus,
  );

  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="display text-3xl sm:text-4xl">
        {t("welcome", { name: session.user.name ?? session.user.email ?? "" })}
      </h1>

      {!session.user.isEmailVerified && (
        <div className="mt-8 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5">
          <h2 className="text-sm font-semibold text-amber-200">
            {t("verifyTitle")}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-100/80">
            {t("verifyBody")}
          </p>
        </div>
      )}

      {/* Dokud není zaplaceno, je paywall to hlavní na stránce.
          Stav bereme ze session, kterou plní jen webhook od Stripu. */}
      {!hasSubscription && (
        <div className="mt-8">
          <Paywall />
        </div>
      )}

      <div className="card mt-8 p-6 sm:p-8">
        <h2 className="display text-lg">{t("nextTitle")}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
          {t("nextBody")}
        </p>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
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
              {t(`plan.${session.user.subscriptionStatus}`)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-8">
        <SignOutButton label={t("signOut")} />
      </div>
    </section>
  );
}
