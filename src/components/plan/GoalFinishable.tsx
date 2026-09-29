"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { goalHex } from "@/lib/plan/colors";

/**
 * „Vypadá to, že jsi to dotáhla."
 *
 * Tohle je náprava tiché díry na konci cesty. Cíl doběhl, poslední úkol
 * se odškrtl — a aplikace mlčky pokračovala dál. Plný pruh, „8 z 8",
 * stav „běží". Žádné uzavření, žádná oslava, nic. Přitom dotažení je
 * jediná věc, kvůli které celá aplikace existuje.
 *
 * Nabídka existovala, ale jen na stránce cíle. Tam se člověk v posledním
 * týdnu nepodívá, protože odškrtává na dnešku. Teď stojí přímo tam.
 *
 * ── Proč se ptáme a neuzavíráme sami ────────────────────────────────
 *
 * Jestli člověk svého cíle dosáhl, ví on, ne my podle počtu zaškrtnutých
 * políček. Plán je návrh, ne podmínka. Navíc se při uzavření píše
 * shrnutí přes model a to stojí peníze — spustit to samo by znamenalo
 * platit za rozhodnutí, které jsme neudělali my.
 *
 * ── Proč to vypadá jako oslava ──────────────────────────────────────
 *
 * Protože to oslava je. Všechno ostatní v aplikaci je pracovní; tohle je
 * jediná chvíle, kdy se něco povedlo celé. Kdyby to vypadalo jako další
 * upozornění, přejde se to jako upozornění.
 */
export function GoalFinishable({
  goals,
}: {
  goals: { id: string; title: string; color: string; pending: number; overdue: boolean }[];
}) {
  const t = useTranslations("plan.finish");
  const router = useRouter();

  const [working, setWorking] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  /** Skryté napořád pro tenhle pohled — „teď ne" se nemá ptát znovu hned. */
  const [dismissed, setDismissed] = useState<string[]>([]);

  const finish = async (id: string) => {
    setWorking(id);
    setFailed(false);

    try {
      const response = await fetch(`/api/goals/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!response.ok) throw new Error("failed");

      // Shrnutí se píše na serveru, takže po návratu už je na stránce
      // dotažených cílů co číst.
      router.push(`/app/goals/${id}/done`);
    } catch {
      setFailed(true);
      setWorking(null);
    }
  };

  const visible = goals.filter((goal) => !dismissed.includes(goal.id));
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((goal) => (
        <div
          key={goal.id}
          style={{ borderLeftColor: goalHex(goal.color) }}
          className="card border-l-[3px] p-5 sm:p-6"
        >
          <p className="text-xs uppercase tracking-wider text-[var(--color-lime-soft)]">
            {t("eyebrow")}
          </p>

          <h3 className="display mt-2 text-xl">
            {t("title", { goal: goal.title })}
          </h3>

          <p className="mt-2 text-base leading-relaxed text-[var(--color-paper-dim)]">
            {/* Tři různé situace, tři různé věty. „Zbývá pět úkolů" a
                „máš hotovo do jednoho" si zaslouží jiné oslovení — a kdo
                má termín za sebou, potřebuje slyšet ještě něco jiného. */}
            {goal.pending === 0
              ? t("bodyClean")
              : t("bodyPending", { count: goal.pending })}
            {goal.overdue && ` ${t("bodyOverdue")}`}
          </p>

          {failed && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            >
              {t("failed")}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={() => void finish(goal.id)}
              disabled={working !== null}
              className="btn-primary !px-5 !py-2.5 disabled:opacity-60"
            >
              {working === goal.id ? t("finishing") : t("finish")}
            </button>

            <button
              type="button"
              onClick={() => setDismissed((list) => [...list, goal.id])}
              className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
            >
              {t("later")}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
