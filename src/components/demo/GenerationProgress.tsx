"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Průběh generování plánu.
 *
 * Skutečné procento neznáme — API vrátí odpověď najednou, ne po částech.
 * Ukazatel proto roste podle uplynulého času a asymptoticky se blíží k 95 %,
 * takže se nikdy nezasekne na jednom čísle ani nedoběhne dřív než odpověď.
 * Doplňují ho fáze, které říkají, co se právě děje, a počítadlo sekund —
 * bez nich působí čtyřicetisekundové čekání jako zamrzlá stránka.
 */

/** Po ~18 s je ukazatel v polovině, po 40 s zhruba na 84 %. */
const TIME_CONSTANT_MS = 18_000;
const CEILING = 95;

/** Kdy (v sekundách) přepnout na další popisek fáze. */
const STAGE_THRESHOLDS = [0, 8, 20, 34];

export function GenerationProgress({
  // Stejný ukazatel používá demo i zakládání cíle — liší se jen popisky fází.
  namespace = "demo.form.progress",
}: {
  namespace?: "demo.form.progress" | "plan.form.progress";
} = {}) {
  const t = useTranslations(namespace);
  const stages = t.raw("stages") as string[];

  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    const id = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const seconds = Math.floor(elapsedMs / 1000);
  const percent = CEILING * (1 - Math.exp(-elapsedMs / TIME_CONSTANT_MS));

  const stageIndex = STAGE_THRESHOLDS.reduce(
    (current, threshold, index) => (seconds >= threshold ? index : current),
    0,
  );

  return (
    <div className="mt-6" aria-live="polite">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium text-[var(--color-paper)]">
          {stages[Math.min(stageIndex, stages.length - 1)]}
        </p>
        <span className="shrink-0 text-sm tabular-nums text-[var(--color-paper-faint)]">
          {t("elapsed", { seconds })}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-emerald-soft)] to-[var(--color-lime-soft)] transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-[var(--color-paper-faint)]">
        {t("note")}
      </p>
    </div>
  );
}
