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
  const [suggesting, setSuggesting] = useState<string | null>(null);
  /**
   * Chyba u toho milníku, kterého se týká.
   *
   * Dřív to byl jeden příznak pro celý oddíl a hláška se vypisovala
   * nahoře pod nadpisem. U šestého milníku v pořadí ji nikdo neuvidí —
   * uložení tedy vypadalo, že mlčky nefunguje, i když server řekl proč.
   */
  const [failed, setFailed] = useState<{ id: string; reason: string } | null>(
    null,
  );

  /**
   * Odměny uložené v tomhle sezení.
   *
   * Hodnota přijde ze serveru až po `router.refresh()`, což chvíli trvá
   * a občas to člověk nestihne zaregistrovat. Do té doby se bere odsud,
   * takže je uložená odměna vidět okamžitě.
   */
  const [saved, setSaved] = useState<Record<string, string | null>>({});

  const color = goalHex(goalColor);
  // Počítá se i s tím, co se právě uložilo — jinak by tlačítko „poradit
  // se vším" zůstalo viset i poté, co se poslední odměna doplnila ručně.
  const withoutReward = milestones.filter(
    (m) => !(m.id in saved ? saved[m.id] : m.rewardText),
  ).length;

  const patch = async (id: string, body: Record<string, unknown>) => {
    setPending(id);
    setFailed(null);
    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Server říká, proč to nešlo — vypršelý přístup vypadá jinak
        // než překlep a uživatel podle toho pozná, co s tím.
        const payload = await response.json().catch(() => null);
        setFailed({ id, reason: payload?.error ?? "generic" });
        return;
      }

      if (typeof body.rewardText === "string") {
        setSaved((current) => ({
          ...current,
          [id]: body.rewardText as string || null,
        }));
      }

      setEditing(null);
      router.refresh();
    } catch {
      setFailed({ id, reason: "offline" });
    } finally {
      setPending(null);
    }
  };

  /**
   * Nechat si poradit — buď se vším, nebo s jedním milníkem.
   *
   * U jednoho to jde i tehdy, když odměnu už má: od toho to je, když se
   * návrh nelíbí. Model se v tom případě dozví, co tam stojí, a vrátí
   * něco jiného.
   */
  const suggest = async (milestoneId?: string) => {
    setSuggesting(milestoneId ?? "all");
    setFailed(null);
    try {
      const response = await fetch(`/api/goals/${goalId}/rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestoneId ? { milestoneId } : {}),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setFailed({
          id: milestoneId ?? "all",
          reason: payload?.error ?? "generic",
        });
        return;
      }

      // Návrh přišel ze serveru, takže místní kopie je zastaralá.
      if (milestoneId) {
        setSaved((current) => {
          const next = { ...current };
          delete next[milestoneId];
          return next;
        });
      }
      router.refresh();
    } catch {
      setFailed({ id: milestoneId ?? "all", reason: "offline" });
    } finally {
      setSuggesting(null);
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
            onClick={() => void suggest()}
            disabled={suggesting !== null}
            className="text-sm font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline disabled:opacity-50"
          >
            {suggesting === "all" ? t("suggesting") : t("suggest")}
          </button>
        )}
      </div>

      <p className="mt-1.5 text-base leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      <ol className="mt-5 space-y-3">
        {milestones.map((milestone) => {
          const achieved = Boolean(milestone.achievedAt);
          // Dokud nedoběhne obnovení ze serveru, platí, co se právě uložilo.
          const reward =
            milestone.id in saved ? saved[milestone.id] : milestone.rewardText;
          const problem = failed?.id === milestone.id ? failed.reason : null;
          const reached = new Date(milestone.targetDate) <= new Date();

          return (
            <li
              key={milestone.id}
              style={{ borderLeftColor: achieved ? color : "transparent" }}
              className={`rounded-xl border border-l-[3px] p-4 ${
                achieved
                  ? "border-edge bg-surface"
                  : "border-edge"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-base font-medium text-[var(--color-paper)]">
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
                    className="w-full rounded-lg border border-edge bg-scrim px-3 py-2 text-sm text-[var(--color-paper)]"
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
                  {reward ? (
                    <span className="text-sm text-[var(--color-paper)]">
                      {t("rewardIs")}{" "}
                      <span style={{ color }}>{reward}</span>
                      {milestone.rewardSource === "AI_SUGGESTED" &&
                        !(milestone.id in saved) && (
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
                      setDraft(reward ?? "");
                    }}
                    className="text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
                  >
                    {reward ? t("change") : t("setReward")}
                  </button>

                  {/* Návrh u každého milníku zvlášť. Dřív to šlo jen
                      hromadně a tlačítko mizelo, jakmile měly odměnu
                      všechny — takže o jiný návrh nešlo požádat. */}
                  <button
                    type="button"
                    onClick={() => void suggest(milestone.id)}
                    disabled={suggesting !== null}
                    className="text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline disabled:opacity-50"
                  >
                    {suggesting === milestone.id
                      ? t("suggesting")
                      : reward
                        ? t("suggestAnother")
                        : t("suggestOne")}
                  </button>
                </div>
              )}

              {problem && (
                <p
                  role="alert"
                  className="mt-2 text-xs text-[var(--color-danger)]"
                >
                  {t(`failures.${problem}`)}
                </p>
              )}

              {/* Dosažení a vyzvednutí */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {achieved ? (
                  <>
                    <span style={{ color }} className="text-xs font-medium">
                      {t("achieved")}
                    </span>
                    {reward &&
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
