"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { GenerationProgress } from "@/components/demo/GenerationProgress";
import { planErrorKey } from "@/lib/plan/errors";
import {
  defaultTargetDate,
  maxTargetDate,
  minTargetDate,
  validateGoal,
  validateTargetDate,
  MAX_GOAL_LENGTH,
} from "@/lib/demo-validation";

/**
 * Založení cíle. Validace je stejná jako v demu a běží i na serveru —
 * tady jen proto, aby uživatel nečekal na kolečko kvůli prázdnému poli.
 */
const importanceLevels = [1, 2, 3, 4, 5] as const;

export function GoalForm() {
  const t = useTranslations("plan.form");
  const tError = useTranslations("plan.errors");
  const router = useRouter();
  const locale = useLocale();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState(defaultTargetDate());
  const [importance, setImportance] = useState(3);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;

    const titleError = validateGoal(title);
    if (titleError) return setError(titleError);

    const dateError = validateTargetDate(targetDate);
    if (dateError) return setError(dateError);

    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate,
          importance,
          // Plán bude v jazyce, ve kterém uživatel aplikaci právě používá.
          locale,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(planErrorKey(data.error));
        setPending(false);
        return;
      }

      // Na detail cíle, kde se dopočítá zbytek rozpadu.
      router.push(`/${locale}/app/goals/${data.goalId}`);
    } catch {
      setError("generic");
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div>
        <label htmlFor="goal-title" className="block text-sm font-medium">
          {t("goalLabel")}
        </label>
        <textarea
          id="goal-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          rows={3}
          maxLength={MAX_GOAL_LENGTH}
          disabled={pending}
          placeholder={t("goalPlaceholder")}
          className="mt-2.5 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] leading-relaxed text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] focus:outline-none disabled:opacity-60"
        />
        <p className="mt-1.5 text-xs text-[var(--color-paper-faint)]">
          {t("goalHint")}
        </p>
      </div>

      <div className="mt-6">
        <label htmlFor="goal-date" className="block text-sm font-medium">
          {t("dateLabel")}
        </label>
        <input
          id="goal-date"
          type="date"
          value={targetDate}
          min={minTargetDate()}
          max={maxTargetDate()}
          disabled={pending}
          onChange={(event) => setTargetDate(event.target.value)}
          className="mt-2.5 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] text-[var(--color-paper)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] focus:outline-none disabled:opacity-60 sm:w-auto"
        />
      </div>

      {/* Důležitost řídí, jak velký díl denní kapacity cíl dostane, když
          jich běží víc. Slovní stupnice schválně — číslo od jedné do pěti
          si každý vyloží jinak. */}
      <fieldset className="mt-6">
        <legend className="block text-sm font-medium">
          {t("importanceLabel")}
        </legend>
        <p className="mt-1.5 text-xs text-[var(--color-paper-faint)]">
          {t("importanceHint")}
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {importanceLevels.map((level) => (
            <label
              key={level}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-[15px] transition ${
                importance === level
                  ? "border-[color-mix(in_oklab,var(--color-lime-glow)_50%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_7%,transparent)]"
                  : "border-white/10 hover:border-white/25"
              }`}
            >
              <input
                type="radio"
                name="importance"
                value={level}
                checked={importance === level}
                disabled={pending}
                onChange={() => setImportance(level)}
                className="h-4 w-4 accent-[var(--color-lime-soft)]"
              />
              <span>{t(`importance.${level}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="goal-context" className="block text-sm font-medium">
          {t("descriptionLabel")}
        </label>
        <textarea
          id="goal-context"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          maxLength={1000}
          disabled={pending}
          placeholder={t("descriptionPlaceholder")}
          className="mt-2.5 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] leading-relaxed text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] focus:outline-none disabled:opacity-60"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {tError(error)}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-7">
        {t("submit")}
      </button>

      {pending && <GenerationProgress namespace="plan.form.progress" />}
    </form>
  );
}
