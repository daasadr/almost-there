import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Paywall } from "@/components/billing/Paywall";
import { CheckoutPending } from "@/components/billing/CheckoutPending";
import { getAccess } from "@/lib/billing/access";

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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  // Middleware sem nepřihlášeného nepustí, tohle je druhá pojistka
  // pro případ, že by se sem někdy sáhlo jinou cestou.
  if (!session?.user) redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "auth.app" });
  const tb = await getTranslations({ locale, namespace: "billing" });

  // Z databáze, ne ze session — viz komentář v lib/billing/access.ts.
  const { status, hasAccess } = await getAccess(session.user.id);

  // Návrat od pokladny. Sama o sobě tahle adresa nic neodemyká, jen mění
  // to, co uživatel po návratu uvidí — otevřít si ji může kdokoliv.
  const { checkout } = await searchParams;

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

      {/* Zaplaceno, ale potvrzení od Stripu ještě nedorazilo. Místo paywallu
          ukážeme, že se čeká — jinak by to vypadalo, že platba propadla. */}
      {!hasAccess && checkout === "success" && (
        <div className="mt-8 rounded-2xl border border-[color-mix(in_oklab,var(--color-lime-glow)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_8%,transparent)] p-5 sm:p-6">
          <h2 className="display text-lg">{tb("successTitle")}</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
            {tb("successBody")}
          </p>
          <CheckoutPending />
        </div>
      )}

      {/* Dokud není zaplaceno, je paywall to hlavní na stránce. */}
      {!hasAccess && checkout !== "success" && (
        <div className="mt-8">
          {checkout === "cancelled" && (
            <div className="mb-4 rounded-2xl border border-white/10 p-5">
              <h2 className="text-sm font-semibold text-[var(--color-paper)]">
                {tb("cancelledTitle")}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
                {tb("cancelledBody")}
              </p>
            </div>
          )}
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
              {t(`plan.${status}`)}
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
