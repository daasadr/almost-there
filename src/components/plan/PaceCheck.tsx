"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { GenerationProgress } from "@/components/demo/GenerationProgress";
import { goalHex } from "@/lib/plan/colors";
import { planErrorKey } from "@/lib/plan/errors";

/**
 * Nabídka, když cíl nabral skluz.
 *
 * Obě možnosti jsou postavené jako rovnocenné. Posunout termín není
 * prohra — je to jediná poctivá reakce na to, že plán počítal s tempem,
 * které nesedí. Kdyby aplikace tlačila do dohánění, naučila by lidi
 * lhát si do termínů.
 *
 * ── Dohánění plán nemění ────────────────────────────────────────────
 *
 * „Doženu skluz" dlouho spouštělo přeplánování: zbytek plánu se smazal
 * a model napsal nový, zhuštěný do zbývajícího času. Trvalo to minuty,
 * stálo to peníze a dělalo to něco jiného, než co ta volba slibuje —
 * kdo říká „doženu to", chce dodělat, co zůstalo, a aby se mu pod
 * rukama nic nehýbalo.
 *
 * Teď se jen poznamená, že to člověk zkusí, a pár dní se mlčí.
 * Nedodělky z minulých dnů má hned pod touhle kartou a může je
 * odškrtat; tím zmizí i ze statistiky a nabídka se sama nevrátí.
 *
 * Podruhé se dohánění nenabízí. Opakovat ho by znamenalo tvrdit, že
 * tentokrát to vyjde, a poctivá odpověď na dluh, který se táhne, je
 * posunout termín.
 */
export function PaceCheck({
  goalId,
  goalTitle,
  goalColor,
  missedDays,
  completionRate,
  targetDate,
  suggestedDate,
  catchUpFailed = false,
  showTitle = true,
}: {
  goalId: string;
  goalTitle: string;
  goalColor: string;
  missedDays: number;
  completionRate: number;
  targetDate: string;
  suggestedDate: string;
  /** Dohánění už jednou slíbil a nevyšlo. Podruhé se nenabízí. */
  catchUpFailed?: boolean;
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

  // Termín ve tvaru YYYY-MM-DD, takže porovnání řetězců stačí a nepletou
  // se do toho časová pásma.
  const deadlinePassed = targetDate <= new Date().toISOString().slice(0, 10);

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
        /*
         * Odpověď bez JSON je typicky proxy, které došla trpělivost.
         * Přepočet přitom na serveru běží dál a za chvíli doběhne —
         * „zkus to znovu" by ho zaplatilo podruhé. Proto se to odlišuje
         * od skutečné chyby a říká se, co se s tím má dělat.
         */
        const data = await response.json().catch(() => null);
        setError(data ? planErrorKey(data.error) : "replanTimedOut");
        setPending(null);
        return;
      }

      // Dohánění ani odmítnutí nic nepřepočítávají — karta prostě
      // zmizí a plán zůstává, jak byl.
      if (mode !== "moveDeadline") setDismissed(true);
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
      className="rounded-2xl border border-l-[3px] border-edge bg-surface p-5 sm:p-6"
    >
      {showTitle && (
        <p
          style={{ color: goalHex(goalColor) }}
          className="text-xs font-semibold uppercase tracking-wider"
        >
          {goalTitle}
        </p>
      )}

      <h2 className="display mt-2 text-lg">
        {catchUpFailed ? t("againTitle") : t("title", { days: missedDays })}
      </h2>
      <p className="mt-1.5 text-base leading-relaxed text-[var(--color-paper-dim)]">
        {catchUpFailed
          ? t("againBody")
          : t("body", { percent: Math.round(completionRate * 100) })}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-[var(--color-danger)]"
        >
          {tError(error)}
        </p>
      )}

      {pending === "moveDeadline" ? (
        <GenerationProgress namespace="plan.form.progress" />
      ) : (
        <div
          className={`mt-5 grid gap-3 ${
            deadlinePassed || catchUpFailed ? "" : "sm:grid-cols-2"
          }`}
        >
          {/*
            Dohnat skluz jde jedině k termínu, který ještě nenastal.
            U uplynulého není do čeho tlačit a pokus by skončil chybou —
            tak ho radši nenabízíme vůbec. Server to odmítne taky, tohle
            je jen o tom, aby na to člověk nenarazil.
          */}
          {!deadlinePassed && !catchUpFailed && (
            <button
              type="button"
              onClick={() => send("catchUp")}
              disabled={Boolean(pending)}
              className="rounded-2xl border border-edge p-4 text-left transition hover:border-edge-hover disabled:opacity-50"
            >
              <span className="block text-base font-medium text-[var(--color-paper)]">
                {t("catchUp")}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-[var(--color-paper-dim)]">
                {t("catchUpBody", { date: asDate(targetDate) })}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => send("moveDeadline")}
            disabled={Boolean(pending)}
            className="rounded-2xl border border-edge p-4 text-left transition hover:border-edge-hover disabled:opacity-50"
          >
            <span className="block text-base font-medium text-[var(--color-paper)]">
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
