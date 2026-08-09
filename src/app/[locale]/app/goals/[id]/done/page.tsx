import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { goalHex } from "@/lib/plan/colors";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Oslava dotaženého cíle.
 *
 * Vlastní stránka, ne proužek v přehledu. Většina lidí svůj cíl nedotáhne;
 * kdo ano, má za sebou měsíce drobné vytrvalosti, kterou nikdo neviděl.
 * Tohle je jediné místo v aplikaci, které nemá žádný jiný úkol než to
 * uznat — proto tu není nic k odškrtnutí, žádná nabídka dalšího cíle
 * a nic na prodej.
 */
export default async function GoalDonePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const goal = await db.goal.findFirst({
    where: { id, userId: session.user.id, status: "COMPLETED" },
    select: {
      id: true,
      title: true,
      color: true,
      createdAt: true,
      completedAt: true,
      completionNote: true,
      targetDate: true,
    },
  });
  if (!goal) notFound();

  const [tasksDone, restDays, stages] = await Promise.all([
    db.task.count({ where: { goalId: goal.id, status: "DONE" } }),
    db.task.count({
      where: { goalId: goal.id, type: "REST", status: "DONE" },
    }),
    db.timeBlock.count({ where: { goalId: goal.id, parentBlockId: null } }),
  ]);

  const t = await getTranslations({ locale, namespace: "plan.done" });
  const format = await getFormatter({ locale });

  const finishedAt = goal.completedAt ?? new Date();
  const days = Math.max(
    1,
    Math.round((finishedAt.getTime() - goal.createdAt.getTime()) / 86_400_000),
  );
  const color = goalHex(goal.color);

  return (
    <section className="relative isolate mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center px-5 py-20 text-center sm:px-8">
      {/* Záře v barvě cíle. Jediná ozdoba na stránce — nic víc není
          potřeba a nic víc by tomu neslušelo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(60% 45% at 50% 22%, ${color}26, transparent 70%)`,
        }}
      />

      <p
        style={{ color }}
        className="text-xs font-semibold uppercase tracking-[0.2em]"
      >
        {t("eyebrow")}
      </p>

      <h1 className="display mt-6 text-4xl leading-tight sm:text-5xl">
        {goal.title}
      </h1>

      <p className="mt-5 text-sm text-[var(--color-paper-faint)]">
        {t("period", {
          from: format.dateTime(goal.createdAt, { dateStyle: "long" }),
          to: format.dateTime(finishedAt, { dateStyle: "long" }),
        })}
      </p>

      {goal.completionNote && (
        <p className="mx-auto mt-9 max-w-xl text-lg leading-relaxed text-[var(--color-paper)]">
          {goal.completionNote}
        </p>
      )}

      <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat value={days} label={t("days")} color={color} />
        <Stat value={tasksDone} label={t("tasks")} color={color} />
        <Stat value={restDays} label={t("rest")} color={color} />
        <Stat value={stages} label={t("stages")} color={color} />
      </dl>

      <p className="mx-auto mt-12 max-w-md text-sm leading-relaxed text-[var(--color-paper-faint)]">
        {t("footnote")}
      </p>

      <div className="mt-10">
        <Link
          href={`/${locale}/app`}
          className="text-sm text-[var(--color-paper-dim)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
        >
          {t("back")}
        </Link>
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 p-5">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span
          style={{ color }}
          className="display block text-3xl tabular-nums sm:text-4xl"
        >
          {value}
        </span>
        <span className="mt-1.5 block text-xs uppercase tracking-wider text-[var(--color-paper-faint)]">
          {label}
        </span>
      </dd>
    </div>
  );
}
