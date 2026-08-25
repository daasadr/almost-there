"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { goalHex } from "@/lib/plan/colors";

export type ReachedMilestone = {
  id: string;
  title: string;
  rewardText: string | null;
  summary: string | null;
  goalTitle: string;
  goalColor: string;
  /** Den, ke kterému milník patřil. */
  targetDate: string;
};

/**
 * Milník, jehož datum uplynulo a uživatel ho ještě nepotvrdil.
 *
 * Tohle je ta zastávka, kvůli které milníky vůbec jsou. Kdyby se
 * potvrzovaly jen schované na detailu cíle, většina lidí by k odměně
 * nikdy nedošla — a odměna, o které se nikdo nedozví, není odměna.
 */
export function ReachedMilestones({
  milestones,
}: {
  milestones: ReachedMilestone[];
}) {
  const t = useTranslations("plan.milestones");
  const format = useFormatter();
  const router = useRouter();

  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);

  const remaining = milestones.filter((m) => !handled.has(m.id));
  if (remaining.length === 0) return null;

  const confirm = async (id: string, achieved: boolean) => {
    setPending(id);
    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achieved }),
      });
      if (!response.ok) throw new Error("failed");

      setHandled((current) => new Set(current).add(id));
      router.refresh();
    } catch {
      // Tichý neúspěch: nabídka zůstane a půjde zkusit znovu.
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      {remaining.map((milestone) => {
        const color = goalHex(milestone.goalColor);

        return (
          <section
            key={milestone.id}
            style={{ borderLeftColor: color }}
            className="rounded-2xl border border-l-[3px] border-white/10 bg-white/[0.02] p-5 sm:p-6"
          >
            <div className="flex items-baseline justify-between gap-4">
              <p
                style={{ color }}
                className="text-xs font-semibold uppercase tracking-wider"
              >
                {milestone.goalTitle}
              </p>
              <p className="shrink-0 text-xs text-[var(--color-paper-faint)]">
                {format.dateTime(new Date(milestone.targetDate), {
                  day: "numeric",
                  month: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <h2 className="display mt-2 text-lg">{t("reachedTitle")}</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper)]">
              {milestone.summary ?? milestone.title}
            </p>
            <p className="mt-2 text-sm text-[var(--color-paper-dim)]">
              {t("reachedBody")}
            </p>

            {milestone.rewardText && (
              <p className="mt-3 text-sm text-[var(--color-paper-dim)]">
                {t("rewardIs")}{" "}
                <span style={{ color }}>{milestone.rewardText}</span>
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => confirm(milestone.id, true)}
                disabled={pending === milestone.id}
                className="btn-primary !px-5 !py-2 text-sm"
              >
                {t("markAchieved")}
              </button>
              <button
                type="button"
                onClick={() => setHandled((c) => new Set(c).add(milestone.id))}
                className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
              >
                {t("undo")}
              </button>
            </div>
          </section>
        );
      })}
    </>
  );
}
