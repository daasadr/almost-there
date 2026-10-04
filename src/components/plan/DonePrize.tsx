"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Odměna na oslavné stránce.
 *
 * Milníky odměny měly, konec cíle ne. Člověk dotáhl něco, co trvalo
 * měsíce, dostal shrnutí a tím to skončilo — zrovna u toho největšího
 * nebylo nic, co by si za to dopřál.
 *
 * Proto to tady nestojí jako poznámka pod čarou, ale jako druhý nadpis
 * stránky. Připomenutí je celý smysl: odměnu si člověk vybral před
 * měsíci a mezitím na ni zapomněl.
 *
 * Když žádná není — u cílů z doby, kdy se závěrečné odměny ještě
 * nenastavovaly — nabídne se tady. Pozdě, ale líp než vůbec, a hlavně
 * přesně ve chvíli, kdy je na ni nárok.
 *
 * Vlastní komponenta, ne ta ze stránky cíle. Tahle nic nevysvětluje
 * a na nic se nechystá: oslavná stránka je jediné místo v aplikaci bez
 * pracovního tónu a karta z plánu by sem ten tón přinesla zpátky.
 */
export function DonePrize({
  goalId,
  color,
  rewardText,
  claimed,
}: {
  goalId: string;
  color: string;
  rewardText: string | null;
  claimed: boolean;
}) {
  const t = useTranslations("plan.finale");
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async (call: () => Promise<Response>) => {
    setBusy(true);
    setFailed(false);
    try {
      const response = await call();
      if (!response.ok) throw new Error("failed");
      setEditing(false);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(() =>
      fetch(`/api/goals/${goalId}/prize`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardText: draft }),
      }),
    );

  const claim = () =>
    run(() =>
      fetch(`/api/goals/${goalId}/prize`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimed: true }),
      }),
    );

  const suggest = () =>
    run(() => fetch(`/api/goals/${goalId}/rewards`, { method: "POST" }));

  return (
    <div
      style={{ borderColor: `${color}40` }}
      className="mt-14 rounded-2xl border px-5 py-8 sm:px-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-paper-faint)]">
        {t("doneEyebrow")}
      </p>

      {editing ? (
        <div className="mx-auto mt-5 max-w-md">
          <input
            type="text"
            value={draft}
            autoFocus
            maxLength={300}
            placeholder={t("rewardPlaceholder")}
            onChange={(event) => setDraft(event.target.value)}
            className="w-full rounded-lg border border-edge bg-scrim px-3.5 py-2.5 text-base text-[var(--color-paper)]"
          />
          <div className="mt-3 flex justify-center gap-5">
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy}
              className="text-sm font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline disabled:opacity-50"
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-[var(--color-paper-faint)]"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : rewardText ? (
        <>
          <p
            style={{ color }}
            className="display mx-auto mt-4 max-w-xl text-2xl leading-snug sm:text-3xl"
          >
            {rewardText}
          </p>

          {claimed ? (
            <p className="mt-5 text-sm text-[var(--color-paper-faint)]">
              {t("claimedDone")}
            </p>
          ) : (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <button
                type="button"
                onClick={() => void claim()}
                disabled={busy}
                className="btn-primary !px-5 !py-2.5 text-sm disabled:opacity-60"
              >
                {t("claim")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setDraft(rewardText);
                }}
                className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
              >
                {t("change")}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-[var(--color-paper-dim)]">
            {t("doneNoReward")}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
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
    </div>
  );
}
