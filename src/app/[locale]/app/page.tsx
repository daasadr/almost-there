import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Paywall } from "@/components/billing/Paywall";
import { CheckoutPending } from "@/components/billing/CheckoutPending";
import { BudgetNotice } from "@/components/plan/BudgetNotice";
import { GoalList } from "@/components/plan/GoalList";
import { PlanTrigger } from "@/components/plan/PlanTrigger";
import { TodayChecklist } from "@/components/plan/TodayChecklist";
import { getAccess } from "@/lib/billing/access";
import { getToday, listGoals } from "@/lib/goals/queries";
import { db } from "@/lib/db";
import Link from "next/link";

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

      {/* Vlastní obsah aplikace. Bez předplatného se nenačítá vůbec —
          nemá cenu sahat do databáze pro data, která se nezobrazí. */}
      {hasAccess && (
        <div className="mt-10 space-y-10">
          <BudgetNotice userId={session.user.id} locale={locale} />
          <Today userId={session.user.id} locale={locale} />
          <Goals userId={session.user.id} locale={locale} />
        </div>
      )}

      <div className="card mt-10 p-6 sm:p-8">
        <h2 className="display text-lg">{t("accountTitle")}</h2>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
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

/**
 * Dnešní checklist.
 *
 * Když na dnešek úkoly nejsou, spustí se dorozpad. Prázdný den totiž může
 * znamenat dvě věci — buď je podle plánu volno, nebo se ještě nerozepsal —
 * a uživatel ten rozdíl sám nepozná.
 */
async function Today({ userId, locale }: { userId: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: "plan.today" });

  const profile = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const today = await getToday(userId, profile?.timezone ?? "Europe/Prague");

  const heading = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${today.date}T12:00:00Z`));

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="display text-2xl">{t("title")}</h2>
        <span className="text-sm text-[var(--color-paper-faint)]">
          {heading}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {today.goalsNeedingPlan.length > 0 && (
          <PlanTrigger goalIds={today.goalsNeedingPlan.map((goal) => goal.id)} />
        )}

        {today.tasks.length > 0 ? (
          <TodayChecklist tasks={today.tasks} />
        ) : (
          today.goalsNeedingPlan.length === 0 && (
            <div className="card p-6">
              <p className="text-[15px] text-[var(--color-paper)]">
                {t("empty")}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
                {t("emptyBody")}
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}

async function Goals({ userId, locale }: { userId: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: "plan.goals" });
  const goals = await listGoals(userId);

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="display text-2xl">{t("title")}</h2>
        {goals.length > 0 && (
          <Link
            href={`/${locale}/app/goals/new`}
            className="text-sm font-medium text-[var(--color-lime-soft)] hover:underline"
          >
            {t("create")}
          </Link>
        )}
      </div>

      <div className="mt-5">
        <GoalList goals={goals} locale={locale} />
      </div>
    </section>
  );
}
