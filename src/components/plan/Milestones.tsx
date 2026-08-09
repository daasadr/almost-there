"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { goalHex } from "@/lib/plan/colors";
import type { MilestoneRow } from "@/lib/goals/milestones";

/**
 * Milníky cíle a odměny za ně.
 *
 * Dlouhý cíl nemá žádnou zpětnou vazbu měsíce dopředu. Bez menších
 * zastávek se dojíždí jen na vůli, které dojde dřív než čas — proto
 * odměna, a proto je konkrétní, ne „něco hezkého“.
 */
export function Milestones({
  goalId,
  goalColor,
  milestones,
}: {
  goalId: string;
  goalColor: string;
  milestones: (Omit<MilestoneRow, "targetDate" | "achievedAt"> & {
    targetDate: string;
    achievedAt: string | null;
  })[];
}) {
  const t = useTranslations("plan.milestones");
  const format = useFormatter();
  const router = useRouter();

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState(false);

  const color = goalHex(goalColor);
  const withoutReward = milestones.filter((m) => !m.rewardText).length;

  const patch = async (id: string, body: Record<string, unknown>) => {
    setPending(id);
    setError(false);
    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("failed");
      setEditing(null);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(null);
    }
  };

  const suggest = async () => {
    setSuggesting(true);
    setError(false);
    try {
      const response = await fetch(`/api/goals/${goalId}/rewards`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setSuggesting(false);
    }
  };

  if (milestones.length === 0) return null;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="display text-lg">{t("title")}</h2>
        {withoutReward > 0 && (
          <button
            type="button"
            onClick={suggest}
            disabled={suggesting}
            className="text-sm font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline disabled:opacity-50"
          >
            {suggesting ? t("suggesting") : t("suggest")}
          </button>
        )}
      </div>

      <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-200">
          {t("failed")}
        </p>
      )}

      <ol className="mt-5 space-y-3">
        {milestones.map((milestone) => {
          const achieved = Boolean(milestone.achievedAt);
          const reached = new Date(milestone.targetDate) <= new Date();

          return (
            <li
              key={milestone.id}
              style={{ borderLeftColor: achieved ? color : "transparent" }}
              className={`rounded-xl border border-l-[3px] p-4 ${
                achieved
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-white/10"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-[15px] font-medium text-[var(--color-paper)]">
                  {milestone.title}
                </h3>
                <span className="text-xs tabular-nums text-[var(--color-paper-faint)]">
                  {format.dateTime(new Date(milestone.targetDate), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {milestone.summary && (
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
                  {milestone.summary}
                </p>
              )}

              {/* Odměna */}
              {editing === milestone.id ? (
                <div className="mt-3">
                  <input
                    type="text"
                    value={draft}
                    autoFocus
                    maxLength={300}
                    placeholder={t("rewardPlaceholder")}
                    onChange={(event) => setDraft(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-[var(--color-paper)]"
                  />
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        patch(milestone.id, { rewardText: draft })
                      }
                      disabled={pending === milestone.id}
                      className="text-xs font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
                    >
                      {t("save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-xs text-[var(--color-paper-faint)]"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  {milestone.rewardText ? (
                    <span className="text-sm text-[var(--color-paper)]">
                      {t("rewardIs")}{" "}
                      <span style={{ color }}>{milestone.rewardText}</span>
                      {milestone.rewardSource === "AI_SUGGESTED" && (
                        <span className="ml-2 text-xs text-[var(--color-paper-faint)]">
                          {t("suggested")}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--color-paper-faint)]">
                      {t("noReward")}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditing(milestone.id);
                      setDraft(milestone.rewardText ?? "");
                    }}
                    className="text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
                  >
                    {milestone.rewardText ? t("change") : t("setReward")}
                  </button>
                </div>
              )}

              {/* Dosažení a vyzvednutí */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {achieved ? (
                  <>
                    <span style={{ color }} className="text-xs font-medium">
                      {t("achieved")}
                    </span>
                    {milestone.rewardText &&
                      (milestone.rewardClaimed ? (
                        <span className="text-xs text-[var(--color-paper-faint)]">
                          {t("claimed")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            patch(milestone.id, { claimed: true })
                          }
                          disabled={pending === milestone.id}
                          className="text-xs font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
                        >
                          {t("claim")}
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => patch(milestone.id, { achieved: false })}
                      disabled={pending === milestone.id}
                      className="text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:underline"
                    >
                      {t("undo")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => patch(milestone.id, { achieved: true })}
                    disabled={pending === milestone.id}
                    className={`text-xs underline-offset-4 hover:underline ${
                      reached
                        ? "font-medium text-[var(--color-lime-soft)]"
                        : "text-[var(--color-paper-faint)]"
                    }`}
                  >
                    {t("markAchieved")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
