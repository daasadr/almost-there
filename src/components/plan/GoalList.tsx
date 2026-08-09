import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { goalHex } from "@/lib/plan/colors";
import type { GoalSummary } from "@/lib/goals/queries";

/** Přehled cílů. Bez interakce, takže serverová komponenta. */
export async function GoalList({
  goals,
  locale,
}: {
  goals: GoalSummary[];
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "plan.goals" });
  const formatDate = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  if (goals.length === 0) {
    return (
      <div className="card p-6 sm:p-8">
        <h2 className="display text-lg">{t("empty")}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
          {t("emptyBody")}
        </p>
        <Link href={`/${locale}/app/goals/new`} className="btn-primary mt-6">
          {t("create")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {goals.map((goal) => (
        <li key={goal.id}>
          <Link
            href={`/${locale}/app/goals/${goal.id}`}
            style={{ borderLeftColor: goalHex(goal.color) }}
            className="card card-hover block border-l-[3px] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="display text-lg">{goal.title}</h3>
              <span className="text-xs text-[var(--color-paper-faint)]">
                {t(`status.${goal.status}`)}
              </span>
            </div>

            <p className="mt-1.5 text-sm text-[var(--color-paper-dim)]">
              {t("targetDate", { date: formatDate.format(goal.targetDate) })}
            </p>

            {goal.tasksTotal > 0 ? (
              <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: goalHex(goal.color),
                      width: `${Math.round((goal.tasksDone / goal.tasksTotal) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--color-paper-faint)]">
                  {t("progress", {
                    done: goal.tasksDone,
                    total: goal.tasksTotal,
                  })}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[var(--color-paper-faint)]">
                {t("noTasks")}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
