"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { goalColors, goalHex, type GoalColor } from "@/lib/plan/colors";
import { planErrorKey } from "@/lib/plan/errors";

/**
 * Nabídka převzít cíl, který si člověk nechal rozfázovat v demu.
 *
 * Ukazuje se hned po zaplacení, protože v tu chvíli je to nejcennější:
 * uživatel má hotový plán na dosah a nemusí nic zadávat znovu. Převzetí
 * je zdarma a nic negeneruje — plán už existuje.
 *
 * Doplňuje se jen to, co demo neznalo: barva, důležitost a podrobnosti.
 */
export function ClaimDemoGoal({
  title,
  targetDate,
  periodCount,
  dailyCapacityMinutes,
}: {
  title: string;
  targetDate: string;
  periodCount: number;
  dailyCapacityMinutes: number;
}) {
  const t = useTranslations("plan.claim");
  const tError = useTranslations("plan.errors");
  const format = useFormatter();
  const router = useRouter();

  const [color, setColor] = useState<GoalColor>("lime");
  const [importance, setImportance] = useState(3);
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);

  if (gone) return null;

  const send = async (claim: boolean) => {
    setPending(claim ? "claim" : "discard");
    setError(null);

    try {
      const response = await fetch("/api/demo/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          claim
            ? { claim: true, color, importance, description: description.trim() }
            : { claim: false },
        ),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(planErrorKey(data.error));
        setPending(null);
        return;
      }

      setGone(true);
      router.refresh();
    } catch {
      setError("generic");
      setPending(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[color-mix(in_oklab,var(--color-lime-glow)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_7%,transparent)] p-5 sm:p-6">
      <h2 className="display text-lg">{t("title")}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("body", { count: periodCount })}
      </p>

      <div className="mt-4 rounded-xl border border-white/10 p-4">
        <p className="text-[15px] text-[var(--color-paper)]">{title}</p>
        <p className="mt-1 text-sm text-[var(--color-paper-dim)]">
          {t("due", {
            date: format.dateTime(new Date(`${targetDate}T12:00:00Z`), {
              dateStyle: "long",
            }),
          })}
        </p>
      </div>

      {/* Demo neznalo dostupný čas, takže plán vznikl s výchozí hodnotou.
          Říct to rovnou je poctivější než nechat člověka objevit to sám. */}
      <p className="mt-4 text-sm leading-relaxed text-[var(--color-paper-faint)]">
        {t("assumptionNote", { minutes: dailyCapacityMinutes })}
      </p>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">{t("colorLabel")}</legend>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {goalColors.map((option) => (
            <label
              key={option}
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 transition ${
                color === option
                  ? "border-[var(--color-paper)]"
                  : "border-transparent hover:border-white/25"
              }`}
            >
              <input
                type="radio"
                name="claim-color"
                checked={color === option}
                onChange={() => setColor(option)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: goalHex(option) }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label
          htmlFor="claim-importance"
          className="block text-sm font-medium"
        >
          {t("importanceLabel")}
        </label>
        <select
          id="claim-importance"
          value={importance}
          onChange={(event) => setImportance(Number(event.target.value))}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-2.5 text-[15px] text-[var(--color-paper)] sm:w-auto"
        >
          {[1, 2, 3, 4, 5].map((level) => (
            <option
              key={level}
              value={level}
              className="bg-[var(--color-ink-900)]"
            >
              {t(`importance.${level}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label htmlFor="claim-detail" className="block text-sm font-medium">
          {t("detailLabel")}
        </label>
        <textarea
          id="claim-detail"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={t("detailPlaceholder")}
          className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] leading-relaxed text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)]"
        />
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
          {t("detailHint")}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {tError(error)}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => send(true)}
          disabled={Boolean(pending)}
          className="btn-primary"
        >
          {pending === "claim" ? t("claiming") : t("claim")}
        </button>

        <button
          type="button"
          onClick={() => send(false)}
          disabled={Boolean(pending)}
          className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline disabled:opacity-50"
        >
          {t("discard")}
        </button>
      </div>
    </section>
  );
}
