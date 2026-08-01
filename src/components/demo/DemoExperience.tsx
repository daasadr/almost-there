"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import type { MonthlyPlan } from "@/lib/ai/schemas";
import {
  defaultTargetDate,
  maxTargetDate,
  minTargetDate,
  validateGoal,
  validateTargetDate,
  MAX_GOAL_LENGTH,
  type DemoErrorKey,
} from "@/lib/demo-validation";
import { DemoResult } from "./DemoResult";
import { GenerationProgress } from "./GenerationProgress";

type State =
  | { status: "form" }
  | { status: "loading" }
  | { status: "done"; plan: MonthlyPlan; goal: string; targetDate: string };

export function DemoExperience() {
  const t = useTranslations("demo");
  const locale = useLocale() as Locale;

  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState(() => defaultTargetDate());
  const [error, setError] = useState<DemoErrorKey | null>(null);
  const [state, setState] = useState<State>({ status: "form" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validujeme i na klientovi, ať uživatel nečeká na kolečko
    // kvůli chybě, kterou vidíme hned. Server validuje znovu.
    const goalError = validateGoal(goal);
    if (goalError) return setError(goalError);
    const dateError = validateTargetDate(targetDate);
    if (dateError) return setError(dateError);

    setError(null);
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim(), targetDate, locale }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError((data?.error as DemoErrorKey) ?? "generic");
        setState({ status: "form" });
        return;
      }

      setState({
        status: "done",
        plan: data.plan as MonthlyPlan,
        goal: goal.trim(),
        targetDate,
      });
    } catch {
      setError("generic");
      setState({ status: "form" });
    }
  };

  if (state.status === "done") {
    return (
      <DemoResult
        plan={state.plan}
        goal={state.goal}
        targetDate={state.targetDate}
        onReset={() => {
          setState({ status: "form" });
          setGoal("");
        }}
      />
    );
  }

  const loading = state.status === "loading";

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8" noValidate>
      <div>
        <label
          htmlFor="goal"
          className="block text-sm font-semibold text-[var(--color-paper)]"
        >
          {t("form.goalLabel")}
        </label>
        <textarea
          id="goal"
          value={goal}
          onChange={(event) => {
            setGoal(event.target.value);
            if (error) setError(null);
          }}
          rows={3}
          maxLength={MAX_GOAL_LENGTH}
          disabled={loading}
          placeholder={t("form.goalPlaceholder")}
          className="mt-2.5 w-full resize-none rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] leading-relaxed text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] focus:outline-none disabled:opacity-60"
        />
        <p className="mt-2 text-xs text-[var(--color-paper-faint)]">
          {t("form.goalHint")}
        </p>
      </div>

      <div className="mt-6">
        <label
          htmlFor="targetDate"
          className="block text-sm font-semibold text-[var(--color-paper)]"
        >
          {t("form.dateLabel")}
        </label>
        <input
          id="targetDate"
          type="date"
          value={targetDate}
          min={minTargetDate()}
          max={maxTargetDate()}
          disabled={loading}
          onChange={(event) => {
            setTargetDate(event.target.value);
            if (error) setError(null);
          }}
          className="mt-2.5 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] text-[var(--color-paper)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] focus:outline-none disabled:opacity-60 sm:w-auto"
        />
        <p className="mt-2 text-xs text-[var(--color-paper-faint)]">
          {t("form.dateHint")}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {t(`errors.${error}`)}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-7">
        {loading && <Spinner />}
        {loading ? t("form.submitting") : t("form.submit")}
      </button>

      {loading && <GenerationProgress />}
    </form>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 animate-spin fill-none stroke-current stroke-[2.5]"
    >
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
    </svg>
  );
}

