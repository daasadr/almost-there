import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { DeleteGoalButton } from "@/components/plan/DeleteGoalButton";
import { GoalImages } from "@/components/plan/GoalImages";
import { MAX_IMAGES_PER_GOAL } from "@/lib/uploads/images";
import { GoalStatusControls } from "@/components/plan/GoalStatusControls";
import { Milestones } from "@/components/plan/Milestones";
import { PaceCheck } from "@/components/plan/PaceCheck";
import { PlanTree } from "@/components/plan/PlanTree";
import { PlanTrigger } from "@/components/plan/PlanTrigger";
import { getAccess } from "@/lib/billing/access";
import { getGoalDetail } from "@/lib/goals/queries";
import { getPaceStatus } from "@/lib/goals/pace";
import { getFinishState } from "@/lib/goals/complete";
import { listMilestones, syncMilestones } from "@/lib/goals/milestones";
import { toIsoDate } from "@/lib/plan/calendar";
import { db } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const session = await auth();
  if (!session?.user?.id) return {};

  const goal = await getGoalDetail(session.user.id, id);
  return { title: goal ? `${goal.title} — AlmostThere` : "AlmostThere" };
}

/** Barva podle toho, jak upřímné hodnocení termínu je. */
const FEASIBILITY_STYLE: Record<string, string> = {
  comfortable: "border-emerald-400/25 text-emerald-200/85",
  realistic: "border-emerald-400/25 text-emerald-200/85",
  ambitious: "border-amber-400/25 text-amber-200/85",
  unrealistic: "border-red-400/30 text-red-200/85",
};

export default async function GoalPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const { hasAccess, revoked } = await getAccess(
    session.user.id,
    session.user.issuedAt,
  );
  if (revoked) redirect(`/${locale}/login`);
  if (!hasAccess) redirect(`/${locale}/app`);

  const goal = await getGoalDetail(session.user.id, id);
  if (!goal) notFound();

  const profile = await db.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const pace = await getPaceStatus(goal.id, profile?.timezone ?? "Europe/Prague");
  const finish = await getFinishState(goal.id, goal.targetDate);
  // Cíle založené dřív, než milníky existovaly, je dostanou při prvním
  // otevření. Operace je idempotentní, takže se to stane jen jednou.
  let milestones = await listMilestones(goal.id);
  if (milestones.length === 0 && goal.tree.length > 0) {
    await syncMilestones(goal.id);
    milestones = await listMilestones(goal.id);
  }

  const t = await getTranslations({ locale, namespace: "plan.detail" });
  const tGoals = await getTranslations({ locale, namespace: "plan.goals" });
  const tStatus = await getTranslations({ locale, namespace: "plan.status" });

  const formatDate = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  // Dokud nejsou dny s úkoly, plán se ještě dorozpadává. Pustíme to hned
  // po otevření cíle, ať to čekání proběhne, než se na plán uživatel podívá.
  const hasDays = goal.tree.some((node) => hasDayLevel(node));

  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <Link
        href={`/${locale}/app`}
        className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
      >
        ← {t("back")}
      </Link>

      <h1 className="display mt-6 text-3xl sm:text-4xl">{goal.title}</h1>
      <p className="mt-2 text-sm text-[var(--color-paper-dim)]">
        {tGoals("targetDate", { date: formatDate.format(goal.targetDate) })}
      </p>

      {goal.description && (
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
          {goal.description}
        </p>
      )}

      {/* Když už jsou dny hotové, hlavní cesta vede na dnešek — ne zpátky
          do čtení plánu. Bez tohohle musel uživatel hledat cestu sám. */}
      {hasDays && goal.status === "ACTIVE" && (
        <Link href={`/${locale}/app`} className="btn-primary mt-6 inline-flex">
          {tStatus("seeToday")}
        </Link>
      )}

      {goal.status === "PAUSED" && (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
          {tStatus("paused")}
        </p>
      )}

      {goal.feasibility && (
        <div className="mt-6">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${
              FEASIBILITY_STYLE[goal.feasibility] ?? "border-white/15"
            }`}
          >
            {t("feasibilityTitle")}: {t(`feasibility.${goal.feasibility}`)}
          </span>
          {goal.feasibilityNote && (
            <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
              {goal.feasibilityNote}
            </p>
          )}
        </div>
      )}

      {goal.restatement && (
        <div className="card mt-8 p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
            {t("restatement")}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper)]">
            {goal.restatement}
          </p>

          {goal.assumptions.length > 0 && (
            <>
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
                {t("assumptions")}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {goal.assumptions.map((assumption) => (
                  <li
                    key={assumption}
                    className="text-sm leading-relaxed text-[var(--color-paper-dim)]"
                  >
                    {assumption}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="mt-8">
        <GoalStatusControls
          goalId={goal.id}
          status={goal.status}
          readyToFinish={goal.status === "ACTIVE" && finish.ready}
          pendingTasks={finish.pending}
        />
      </div>

      {/* Nabídka přeplánování patří nad plán: když se cíl rozešel se
          skutečností, je čtení starého rozpisu ztráta času. */}
      {pace?.behind && (
        <div className="mt-8">
          <PaceCheck
            goalId={goal.id}
            goalTitle={goal.title}
            goalColor={goal.color}
            missedDays={pace.missedDays}
            completionRate={pace.completionRate}
            targetDate={toIsoDate(pace.targetDate)}
            suggestedDate={toIsoDate(pace.suggestedDate)}
            showTitle={false}
          />
        </div>
      )}

      <div className="mt-8">
        <Milestones
          goalId={goal.id}
          goalColor={goal.color}
          milestones={milestones.map((milestone) => ({
            ...milestone,
            // Do klientské komponenty jdou data jako řetězce; Date by se
            // při serializaci stejně proměnil v řetězec, jen bez typu.
            targetDate: milestone.targetDate.toISOString(),
            achievedAt: milestone.achievedAt?.toISOString() ?? null,
          }))}
        />
      </div>

      <div className="mt-8">
        <GoalImages
          goalId={goal.id}
          images={goal.images}
          maxImages={MAX_IMAGES_PER_GOAL}
        />
      </div>

      {/* Bez `auto`: na detailu se rozpad na dny spustí až na kliknutí.
          Uživatel si tu čte horní rozpad a teprve se rozhoduje, jestli si
          cíl nechá — utrácet za dny dřív než on sám řekne, je zbytečné. */}
      {!hasDays && (
        <div className="mt-8">
          <PlanTrigger goalIds={[goal.id]} auto={false} />
        </div>
      )}

      <h2 className="display mt-12 text-2xl">{t("planTitle")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-paper-faint)]">
        {t("expandHint")}
      </p>

      <div className="mt-6">
        <PlanTree nodes={goal.tree} locale={locale} />
      </div>

      <div className="mt-12 border-t border-white/10 pt-8">
        <DeleteGoalButton goalId={goal.id} />
      </div>
    </section>
  );
}

function hasDayLevel(node: {
  level: string;
  children: { level: string; children: unknown[] }[];
}): boolean {
  if (node.level === "DAY") return true;
  return node.children.some((child) =>
    hasDayLevel(child as Parameters<typeof hasDayLevel>[0]),
  );
}
