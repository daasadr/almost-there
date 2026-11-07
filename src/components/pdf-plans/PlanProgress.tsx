"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Výroba zaplaceného plánu, kolo po kole.
 *
 * Server dělá jedno volání modelu na požadavek, klient se ptá znovu,
 * dokud nepřijde `done`. Dvanáctitýdenní plán je třináct kol a jedním
 * dlouhým požadavkem by to neprošlo — proxy ho utne dřív.
 *
 * Opakuje se i po chybě, protože každé hotové kolo je uložené: další
 * pokus naváže tam, kde se přestalo, a znovu se neplatí za hotové.
 * Teprve když se nepovede ani po pokusech, ukáže se chyba — a i tehdy
 * je zaplacený plán v pořádku, jen nedokončený.
 */

/** Kolik kol nejvýš, aby se to při chybě netočilo donekonečna. */
const MAX_ROUNDS = 30;
/** Kolikrát zkusit kolo, které spadlo na něčem přechodném. */
const RETRIES = 2;
const WAIT_MS = [2_000, 6_000];

type Progress = { done: number; total: number };

export function PlanProgress({
  planId,
  initial,
}: {
  planId: string;
  initial: Progress;
}) {
  const t = useTranslations("pdfPlans");
  const router = useRouter();

  const [progress, setProgress] = useState(initial);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  const onPage = useRef(true);

  const run = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    setFailed(false);

    for (let round = 0; round < MAX_ROUNDS; round++) {
      let outcome: { done: boolean; progress: Progress } | null = null;

      for (let attempt = 0; attempt <= RETRIES; attempt++) {
        try {
          const response = await fetch(`/api/pdf-plans/${planId}/generate`, {
            method: "POST",
          });

          if (response.ok) {
            outcome = await response.json();
            break;
          }

          // Nezaplaceno ani cizí plán se opakováním nespraví.
          if (response.status === 402 || response.status === 404) {
            setFailed(true);
            return;
          }
        } catch {
          // Spadlé spojení. Na mobilu běžné, když se telefon uspí.
        }

        const pause = WAIT_MS[attempt];
        if (pause !== undefined) {
          await new Promise((resolve) => setTimeout(resolve, pause));
        }
      }

      if (!outcome) {
        setFailed(true);
        started.current = false;
        return;
      }

      if (onPage.current) setProgress(outcome.progress);

      if (outcome.done) {
        // Hotovo. Překreslení ze serveru ukáže tlačítko ke stažení.
        if (onPage.current) router.refresh();
        return;
      }
    }

    setFailed(true);
    started.current = false;
  }, [planId, router]);

  useEffect(() => {
    onPage.current = true;
    void run();
    return () => {
      onPage.current = false;
    };
  }, [run]);

  const percent =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  if (failed) {
    return (
      <div className="card mt-8 p-5 sm:p-6">
        <h2 className="display text-lg">{t("failedTitle")}</h2>
        <p className="mt-2 text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("failedBody")}
        </p>
        <button
          type="button"
          onClick={() => {
            started.current = false;
            void run();
          }}
          className="btn-primary mt-4"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="card mt-8 p-5 sm:p-6">
      <h2 className="display text-lg">{t("statusTitle")}</h2>
      <p className="mt-2 text-base leading-relaxed text-[var(--color-paper-dim)]">
        {t("statusBody")}
      </p>

      {/*
        Ukazatel se opírá o hotové týdny, ne o čas. Neurčité kolečko
        by u věci, která trvá minuty, vypadalo jako zamrzlá stránka —
        a tady navíc člověk právě zaplatil a chce vidět, že se něco
        děje.
      */}
      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-strong"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("statusTitle")}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-emerald-soft)] to-[var(--color-lime-soft)] transition-[width] duration-700"
          style={{ width: `${Math.max(percent, 4)}%` }}
        />
      </div>

      <p className="mt-2 text-sm tabular-nums text-[var(--color-paper-faint)]">
        {t("statusProgress", { done: progress.done, total: progress.total })}
      </p>
    </div>
  );
}
