"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

/**
 * Pozastavení, znovuspuštění a uzavření cíle.
 *
 * Uzavření je jiná operace než ostatní: je nevratné v tom smyslu, že se
 * u něj vypíše závěrečné shrnutí, a chvíli trvá. Proto vlastní stav
 * čekání a přesměrování na oslavu, ne tichý návrat na stejnou stránku.
 */
export function GoalStatusControls({
  goalId,
  status,
  readyToFinish,
  pendingTasks,
}: {
  goalId: string;
  status: string;
  /** Blíží se termín nebo je hotová většina úkolů. */
  readyToFinish: boolean;
  /** Kolik úkolů zůstalo neodškrtaných. */
  pendingTasks: number;
}) {
  const t = useTranslations("plan.status");
  const router = useRouter();
  const locale = useLocale();

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const send = async (next: "ACTIVE" | "PAUSED" | "COMPLETED") => {
    setPending(next);
    setError(false);

    try {
      const response = await fetch(`/api/goals/${goalId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error("failed");

      if (next === "COMPLETED") {
        router.push(`/${locale}/app/goals/${goalId}/done`);
      } else {
        router.refresh();
      }
    } catch {
      setError(true);
      setPending(null);
    }
  };

  if (status === "COMPLETED") {
    return (
      <div className="flex flex-wrap items-center gap-5">
        <a
          href={`/${locale}/app/goals/${goalId}/done`}
          className="text-sm font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
        >
          {t("seeCelebration")}
        </a>
        <button
          type="button"
          onClick={() => send("ACTIVE")}
          disabled={Boolean(pending)}
          className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline disabled:opacity-50"
        >
          {t("reopen")}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Nabídka uzavřít se ukáže sama, až to dává smysl. Tlačítko
          „hotovo“ trvale mezi ostatními svádí k předčasnému odškrtnutí. */}
      {readyToFinish && status === "ACTIVE" && (
        <div className="mb-5 rounded-2xl border border-[color-mix(in_oklab,var(--color-lime-glow)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_7%,transparent)] p-5">
          <h3 className="display text-lg">{t("readyTitle")}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
            {t("readyBody")}
          </p>
          {pendingTasks > 0 && (
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-paper-faint)]">
              {t("leftover", { count: pendingTasks })}
            </p>
          )}

          <button
            type="button"
            onClick={() => send("COMPLETED")}
            disabled={Boolean(pending)}
            className="btn-primary mt-4"
          >
            {pending === "COMPLETED" ? t("finishing") : t("finish")}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-200">
          {t("failed")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-5">
        {status === "ACTIVE" ? (
          <button
            type="button"
            onClick={() => send("PAUSED")}
            disabled={Boolean(pending)}
            className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline disabled:opacity-50"
          >
            {t("pause")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => send("ACTIVE")}
            disabled={Boolean(pending)}
            className="text-sm font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline disabled:opacity-50"
          >
            {t("resume")}
          </button>
        )}

        {/* Uzavřít jde i bez nabídky — jen se to nenabízí samo. */}
        {status === "ACTIVE" && !readyToFinish && (
          <button
            type="button"
            onClick={() => send("COMPLETED")}
            disabled={Boolean(pending)}
            className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline disabled:opacity-50"
          >
            {pending === "COMPLETED" ? t("finishing") : t("finishQuiet")}
          </button>
        )}
      </div>
    </div>
  );
}
