"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Plan } from "@/lib/ai/schemas";

/**
 * Výstup dema — pouze měsíční rozpad (fáze 1).
 *
 * Poznámka o tom, že jde o zjednodušenou ukázku, je součástí výstupu, ne
 * poznámka pod čarou: uživatel musí vědět, co v plné verzi dostane navíc
 * (zadání, bod 8).
 */
export function DemoResult({
  plan,
  goal,
  targetDate,
  onReset,
}: {
  plan: Plan;
  goal: string;
  targetDate: string;
  onReset: () => void;
}) {
  const t = useTranslations("demo.result");
  const tForm = useTranslations("demo.form");
  const locale = useLocale();

  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${targetDate}T00:00:00Z`));

  return (
    <div className="space-y-5">
      <header className="card p-6 sm:p-8">
        <h2 className="display text-2xl sm:text-3xl">{t("title")}</h2>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
              {t("goalLabel")}
            </dt>
            <dd className="mt-1.5 text-[15px] text-[var(--color-paper)]">
              {goal}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
              {t("deadlineLabel")}
            </dt>
            <dd className="mt-1.5 text-[15px] text-[var(--color-paper)]">
              {formattedDate}
            </dd>
            <dd className="mt-1 text-sm text-[var(--color-paper-faint)]">
              {t(`levels.${plan.level}.count`, { count: plan.periods.length })}
            </dd>
          </div>
        </dl>

        <p className="mt-6 border-l-2 border-[color-mix(in_oklab,var(--color-lime-glow)_40%,transparent)] pl-4 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
          {plan.goalRestated}
        </p>

        <div className="mt-5">
          <FeasibilityBadge value={plan.feasibility} />
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
            {plan.feasibilityNote}
          </p>
        </div>
      </header>

      {/* Osa nejvyšší úrovně — jediná, kterou demo generuje. Jednotka se
          řídí délkou horizontu: u dlouhých cílů roky, u krátkých týdny. */}
      <ol className="card divide-y divide-white/5 p-2">
        {plan.periods.map((period) => (
          <li key={period.index} className="flex gap-5 p-5 sm:p-6">
            <div className="flex shrink-0 flex-col items-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--color-lime-glow)_30%,transparent)] text-sm font-semibold text-[var(--color-lime-soft)]">
                {period.index}
              </span>
              {period.index < plan.periods.length && (
                <span
                  aria-hidden="true"
                  className="mt-2 w-px flex-1 bg-gradient-to-b from-[color-mix(in_oklab,var(--color-emerald-glow)_35%,transparent)] to-transparent"
                />
              )}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
                {t(`levels.${plan.level}.item`, { n: period.index })}
              </p>
              <h3 className="display mt-1 text-lg">{period.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
                {period.milestone}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {plan.assumptions.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-sm font-semibold text-[var(--color-paper)]">
            {t("assumptionsTitle")}
          </h3>
          <ul className="mt-3 space-y-2">
            {plan.assumptions.map((assumption) => (
              <li
                key={assumption}
                className="flex gap-3 text-sm text-[var(--color-paper-faint)]"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />
                {assumption}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--color-paper-faint)]">
            {t("aiNote")}
          </p>
        </div>
      )}

      {/* Hranice dema vůči plné verzi — musí být neprehlédnutelná */}
      <div className="card border-[color-mix(in_oklab,var(--color-violet-soft)_28%,transparent)] p-6 sm:p-8">
        <h3 className="display text-lg text-[var(--color-violet-soft)]">
          {t("noticeTitle")}
        </h3>
        <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
          {t("noticeBody")}
        </p>

        <div className="mt-7 border-t border-white/5 pt-6">
          <h4 className="display text-xl">{t("ctaTitle")}</h4>
          <p className="mt-2 text-[15px] text-[var(--color-paper-dim)]">
            {t("ctaBody")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/#pricing" className="btn-primary">
              {t("cta")}
            </Link>
            <button type="button" onClick={onReset} className="btn-secondary">
              {tForm("again")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeasibilityBadge({ value }: { value: Plan["feasibility"] }) {
  const t = useTranslations("demo.result.feasibility");

  // Hodnocení termínu barvíme, ať je čitelné na první pohled —
  // od "v pohodě" po "takhle to nevyjde".
  const styles: Record<Plan["feasibility"], string> = {
    comfortable:
      "border-[color-mix(in_oklab,var(--color-emerald-soft)_45%,transparent)] text-[var(--color-emerald-soft)]",
    realistic:
      "border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] text-[var(--color-lime-soft)]",
    ambitious: "border-amber-400/45 text-amber-300",
    unrealistic: "border-red-400/45 text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider ${styles[value]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(value)}
    </span>
  );
}
