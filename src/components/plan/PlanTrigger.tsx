"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { planErrorKey } from "@/lib/plan/errors";

/**
 * Dorozpad plánu na nejbližší období.
 *
 * Spouští se sám, jakmile se zjistí, že na dnešek nejsou úkoly. Nechat to
 * na uživateli by znamenalo, že přijde do aplikace a najde prázdno, aniž by
 * tušil, že si má o den říct.
 *
 * Generování je drahé, takže se hlídá, aby jedno načtení stránky spustilo
 * nejvýš jeden pokus na cíl.
 */
/** Nejhlubší cesta je rok → měsíc → týden → den, tedy tři sestupy.
 *  Čtvrté kolo je rezerva, ne očekávaný stav. */
const MAX_ROUNDS = 4;

export function PlanTrigger({
  goalIds,
  auto = true,
}: {
  goalIds: string[];
  auto?: boolean;
}) {
  const t = useTranslations("plan.today");
  const tError = useTranslations("plan.errors");
  const router = useRouter();

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const run = useCallback(async () => {
    if (started.current) return;
    started.current = true;

    setRunning(true);
    setError(null);

    try {
      for (const goalId of goalIds) {
        // Server dělá jedno volání modelu na požadavek, aby žádný z nich
        // netrval minuty. U ročního cíle je potřeba sestoupit přes měsíce
        // a týdny až na dny, tedy tři kola. Strop je pojistka proti tomu,
        // aby se při chybě točilo donekonečna.
        for (let round = 0; round < MAX_ROUNDS; round++) {
          const response = await fetch(`/api/goals/${goalId}/plan`, {
            method: "POST",
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            setError(planErrorKey(data.error));
            return;
          }

          const data = await response.json();
          if (data.done) break;
        }
      }
      router.refresh();
    } catch {
      setError("generic");
    } finally {
      setRunning(false);
    }
  }, [goalIds, router]);

  useEffect(() => {
    if (auto && goalIds.length > 0) void run();
  }, [auto, goalIds, run]);

  if (goalIds.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 p-5 sm:p-6">
      <h2 className="display text-lg">{t("preparingTitle")}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("preparingBody")}
      </p>

      {running && (
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label={t("preparingTitle")}
        >
          {/* Neurčitý ukazatel: kolik zbývá, se odhadnout nedá — server
              vrátí odpověď najednou. Pulzování aspoň říká, že se pracuje. */}
          <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-[var(--color-emerald-soft)] to-[var(--color-lime-soft)]" />
        </div>
      )}

      {error && (
        <>
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
          >
            {tError(error)}
          </p>
          <button
            type="button"
            className="btn-primary mt-4"
            onClick={() => {
              started.current = false;
              void run();
            }}
          >
            {t("preparingCta")}
          </button>
        </>
      )}
    </div>
  );
}
