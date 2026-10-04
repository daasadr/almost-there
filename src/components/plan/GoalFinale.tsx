"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { goalHex } from "@/lib/plan/colors";

/**
 * Čím cíl skončí: závěrečná zkouška a odměna za ni.
 *
 * Stojí nahoře, hned pod tím, jak byl cíl pochopen, a ne dole u milníků.
 * Je to konec cesty, takže by patřil na konec stránky — jenže přesně
 * tam ho nikdo neuvidí. A cíl, u kterého není poznat, čím skončí, se
 * těžko dotahuje: člověk odškrtává dny a netuší, kam dojdou.
 *
 * Zkouška a odměna jsou schválně v jedné kartě. Samotná zkouška je
 * nárok, samotná odměna je úplatek; teprve spolu z toho je výměna,
 * která za to stojí.
 */
export function GoalFinale({
  goalId,
  goalColor,
  challenge,
  rewardText,
  rewardSource,
  rewardClaimed,
  completed,
}: {
  goalId: string;
  goalColor: string;
  /** Prázdné u cílů založených dřív, než zkoušky existovaly. */
  challenge: string | null;
  rewardText: string | null;
  rewardSource: string | null;
  rewardClaimed: boolean;
  /** Dotažený cíl: odměna se dá odškrtnout, zkouška je za námi. */
  completed: boolean;
}) {
  const t = useTranslations("plan.finale");
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const color = goalHex(goalColor);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/goals/${goalId}/prize`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("failed");
      setEditing(false);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  /*
   * Návrh odměny jede přes tutéž cestu jako odměny za etapy.
   *
   * Je to jedno volání modelu, které obslouží obojí — etapy bez odměny
   * i cíl bez závěrečné. Vlastní cesta jen pro tohle by stála další
   * peníze a odměna za cíl by nevěděla, co už padlo u etap.
   */
  const suggest = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/goals/${goalId}/rewards`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  // Starý cíl bez zkoušky a bez odměny nemá co ukazovat — kromě nabídky
  // odměnu si pořídit, a ta stojí za vlastní kartu až ve chvíli, kdy je
  // co odměňovat. Zkouška se takovým cílům doplní při přeplánování.
  if (!challenge && !rewardText && completed) return null;

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="display text-lg">{t("title")}</h2>

      {challenge ? (
        <>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
            {t("challenge")}
          </h3>
          <p className="mt-2 text-base leading-relaxed text-[var(--color-paper)]">
            {challenge}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-paper-faint)]">
          {t("noChallenge")}
        </p>
      )}

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
        {t("reward")}
      </h3>

      {editing ? (
        <div className="mt-2">
          <input
            type="text"
            value={draft}
            autoFocus
            maxLength={300}
            placeholder={t("rewardPlaceholder")}
            onChange={(event) => setDraft(event.target.value)}
            className="w-full rounded-lg border border-edge bg-scrim px-3 py-2 text-sm text-[var(--color-paper)]"
          />
          <div className="mt-2 flex gap-4">
            <button
              type="button"
              onClick={() => void patch({ rewardText: draft })}
              disabled={busy}
              className="text-xs font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline disabled:opacity-50"
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-[var(--color-paper-faint)]"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : rewardText ? (
        <>
          <p
            style={{ color }}
            className="display mt-2 text-xl leading-snug sm:text-2xl"
          >
            {rewardText}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {rewardSource === "AI_SUGGESTED" && (
              <span className="text-xs text-[var(--color-paper-faint)]">
                {t("suggested")}
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setDraft(rewardText);
              }}
              className="text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
            >
              {t("change")}
            </button>

            {/* Odškrtnout jde až po dotažení. Dřív by to byla jen
                možnost obejít celou tu dohodu. */}
            {completed &&
              (rewardClaimed ? (
                <span className="text-xs text-[var(--color-paper-faint)]">
                  {t("claimed")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void patch({ claimed: true })}
                  disabled={busy}
                  className="text-xs font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {t("claim")}
                </button>
              ))}
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-paper-dim)]">
            {t("noReward")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setDraft("");
              }}
              className="text-sm font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
            >
              {t("setReward")}
            </button>
            <button
              type="button"
              onClick={() => void suggest()}
              disabled={busy}
              className="text-sm text-[var(--color-paper-dim)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline disabled:opacity-50"
            >
              {busy ? t("suggesting") : t("suggest")}
            </button>
          </div>
        </>
      )}

      {failed && (
        <p role="alert" className="mt-4 text-sm text-red-200">
          {t("failed")}
        </p>
      )}
    </section>
  );
}
