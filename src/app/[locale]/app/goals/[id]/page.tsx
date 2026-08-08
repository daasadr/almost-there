import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { DeleteGoalButton } from "@/components/plan/DeleteGoalButton";
import { GoalImages } from "@/components/plan/GoalImages";
import { MAX_IMAGES_PER_GOAL } from "@/lib/uploads/images";
import { PlanTree } from "@/components/plan/PlanTree";
import { PlanTrigger } from "@/components/plan/PlanTrigger";
import { getAccess } from "@/lib/billing/access";
import { getGoalDetail } from "@/lib/goals/queries";

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

  const { hasAccess } = await getAccess(session.user.id);
  if (!hasAccess) redirect(`/${locale}/app`);

  const goal = await getGoalDetail(session.user.id, id);
  if (!goal) notFound();

  const t = await getTranslations({ locale, namespace: "plan.detail" });
  const tGoals = await getTranslations({ locale, namespace: "plan.goals" });

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
