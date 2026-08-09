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
import { PaceCheck } from "@/components/plan/PaceCheck";
import { UnfinishedTasks } from "@/components/plan/UnfinishedTasks";
import { UsageMeter } from "@/components/plan/UsageMeter";
import { isAdminEmail } from "@/lib/admin/guard";
import { getAccess } from "@/lib/billing/access";
import { getOverdue, getToday, listGoals } from "@/lib/goals/queries";
import { getBehindGoals } from "@/lib/goals/pace";
import { toIsoDate } from "@/lib/plan/calendar";
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
  const tPlan = await getTranslations({ locale, namespace: "plan.nav" });

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

        {hasAccess && (
          <div className="mt-7 border-t border-white/5 pt-6 text-sm">
            <UsageMeter userId={session.user.id} locale={locale} />
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
  const timezone = profile?.timezone ?? "Europe/Prague";
  const [today, overdue, behind] = await Promise.all([
    getToday(userId, timezone),
    getOverdue(userId, timezone),
    getBehindGoals(userId, timezone),
  ]);

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
        {/* Nejdřív nabídka přeplánování: když se cíl rozešel se
            skutečností, nemá cenu odškrtávat úkoly ze starého plánu. */}
        {behind.map((goal) => (
          <PaceCheck
            key={goal.goalId}
            goalId={goal.goalId}
            goalTitle={goal.title}
            goalColor={goal.color}
            missedDays={goal.missedDays}
            completionRate={goal.completionRate}
            targetDate={toIsoDate(goal.targetDate)}
            suggestedDate={toIsoDate(goal.suggestedDate)}
          />
        ))}

        {/* Nedodělky z minulých dnů: kdo je má, má je vidět dřív,
            než začne odškrtávat další. */}
        {overdue.length > 0 && <UnfinishedTasks tasks={overdue} />}

        {today.goalsNeedingPlan.length > 0 && (
          <PlanTrigger goalIds={today.goalsNeedingPlan.map((goal) => goal.id)} />
        )}

        {today.tasks.length > 0 ? (
          <TodayChecklist
            tasks={today.tasks}
            daySeed={daySeed(today.date)}
            dailyImages={today.dailyImages}
          />
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

/**
 * Číslo dne pro výběr dnešní pochvaly.
 *
 * Počítá se z data, ne z náhody — jeden den, jedna hláška. Zároveň se
 * tím vyhneme rozdílu mezi tím, co vykreslí server a co klient.
 */
function daySeed(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000);
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
