"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { goalHex } from "@/lib/plan/colors";
import type { OverdueTask } from "@/lib/goals/queries";

/**
 * Nedodělané úkoly z minulých dnů.
 *
 * Tón je tu důležitější než funkce. Plán, který mlčky přejde vynechaný
 * den, učí, že na plnění nezáleží — ale plán, který za něj kárá, se
 * přestane otevírat. Proto konstatování bez hodnocení a dvě rovnocenné
 * cesty ven: dodělat, nebo to nechat být.
 *
 * „Nechat být“ není totéž co smazat. Úkol zůstane v plánu označený jako
 * vynechaný, takže přeplánování ví, co se nestihlo, a přestane připomínat.
 */
export function UnfinishedTasks({ tasks }: { tasks: OverdueTask[] }) {
  const t = useTranslations("plan.overdue");
  const format = useFormatter();
  const router = useRouter();

  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState(false);

  const remaining = tasks.filter((task) => !handled.has(task.id));
  if (remaining.length === 0) return null;

  const resolve = async (taskId: string, status: "DONE" | "SKIPPED") => {
    setHandled((current) => new Set(current).add(taskId));
    setFailed(false);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("write failed");
      router.refresh();
    } catch {
      setHandled((current) => {
        const next = new Set(current);
        next.delete(taskId);
        return next;
      });
      setFailed(true);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-[var(--color-paper)]">
        {t("title", { count: remaining.length })}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      {failed && (
        <p role="alert" className="mt-4 text-sm text-red-200">
          {t("failed")}
        </p>
      )}

      <ul className="mt-4 space-y-2.5">
        {remaining.map((task) => (
          <li
            key={task.id}
            style={{ borderLeftColor: goalHex(task.goalColor) }}
            className="border-l-2 pl-3.5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-[15px] leading-snug text-[var(--color-paper)]">
                {task.title}
              </span>
              <span className="shrink-0 text-xs text-[var(--color-paper-faint)]">
                {format.dateTime(task.date, {
                  weekday: "long",
                  day: "numeric",
                  month: "numeric",
                })}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-xs text-[var(--color-paper-faint)]">
                {task.goalTitle}
              </span>

              <button
                type="button"
                onClick={() => resolve(task.id, "DONE")}
                className="text-xs font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
              >
                {t("markDone")}
              </button>

              <button
                type="button"
                onClick={() => resolve(task.id, "SKIPPED")}
                className="text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
              >
                {t("letGo")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
