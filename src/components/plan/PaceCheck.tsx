"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { GenerationProgress } from "@/components/demo/GenerationProgress";
import { goalHex } from "@/lib/plan/colors";
import { planErrorKey } from "@/lib/plan/errors";

/**
 * Nabídka přeplánování, když cíl nabral skluz.
 *
 * Obě možnosti jsou postavené jako rovnocenné. Posunout termín není
 * prohra — je to jediná poctivá reakce na to, že plán počítal s tempem,
 * které nesedí. Kdyby aplikace tlačila do dohánění, naučila by lidi
 * lhát si do termínů.
 */
export function PaceCheck({
  goalId,
  goalTitle,
  goalColor,
  missedDays,
  completionRate,
  targetDate,
  suggestedDate,
  showTitle = true,
}: {
  goalId: string;
  goalTitle: string;
  goalColor: string;
  missedDays: number;
  completionRate: number;
  targetDate: string;
  suggestedDate: string;
  showTitle?: boolean;
}) {
  const t = useTranslations("plan.pace");
  const tError = useTranslations("plan.errors");
  const format = useFormatter();
  const router = useRouter();

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const send = async (mode: "catchUp" | "moveDeadline" | "decline") => {
    setPending(mode);
    setError(null);

    try {
      const response = await fetch(`/api/goals/${goalId}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(planErrorKey(data.error));
        setPending(null);
        return;
      }

      if (mode === "decline") setDismissed(true);
      router.refresh();
    } catch {
      setError("generic");
      setPending(null);
    }
  };

  const asDate = (iso: string) =>
    format.dateTime(new Date(`${iso}T12:00:00Z`), { dateStyle: "long" });

  return (
    <section
      style={{ borderLeftColor: goalHex(goalColor) }}
      className="rounded-2xl border border-l-[3px] border-white/10 bg-white/[0.02] p-5 sm:p-6"
    >
      {showTitle && (
        <p
          style={{ color: goalHex(goalColor) }}
          className="text-xs font-semibold uppercase tracking-wider"
        >
          {goalTitle}
        </p>
      )}

      <h2 className="display mt-2 text-lg">{t("title", { days: missedDays })}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("body", { percent: Math.round(completionRate * 100) })}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {tError(error)}
        </p>
      )}

      {pending && pending !== "decline" ? (
        <GenerationProgress namespace="plan.form.progress" />
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => send("catchUp")}
            disabled={Boolean(pending)}
            className="rounded-2xl border border-white/10 p-4 text-left transition hover:border-white/25 disabled:opacity-50"
          >
            <span className="block text-[15px] font-medium text-[var(--color-paper)]">
              {t("catchUp")}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-[var(--color-paper-dim)]">
              {t("catchUpBody", { date: asDate(targetDate) })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => send("moveDeadline")}
            disabled={Boolean(pending)}
            className="rounded-2xl border border-white/10 p-4 text-left transition hover:border-white/25 disabled:opacity-50"
          >
            <span className="block text-[15px] font-medium text-[var(--color-paper)]">
              {t("moveDeadline")}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-[var(--color-paper-dim)]">
              {t("moveDeadlineBody", { date: asDate(suggestedDate) })}
            </span>
          </button>
        </div>
      )}

      {!pending && (
        <button
          type="button"
          onClick={() => send("decline")}
          className="mt-4 text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
        >
          {t("later")}
        </button>
      )}
    </section>
  );
}
