"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import {
  billingPeriods,
  priceFor,
  YEARLY_MONTHS_FREE,
  type BillingPeriod,
} from "@/lib/stripe/plans";

/**
 * Paywall před založením prvního cíle (zadání, bod 8).
 *
 * Cena tu musí sedět s tou, kterou zákazník uvidí u pokladny — proto se
 * bere ze `plans.ts`, ne z překladů. Kdyby byla na dvou místech, jednou
 * by se rozešla.
 */
export function Paywall() {
  const t = useTranslations("billing");
  const locale = useLocale() as Locale;

  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);


  const start = async () => {
    setFailed(false);
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Souhlas se zahájením plnění. Úkonem je samo kliknutí na
        // tlačítko, u kterého to prohlášení stojí — proto vždy .
        body: JSON.stringify({ period, locale, immediateStart: true }),
      });
      const data = await response.json();

      // Uživatel už předplatné má a jen o tom neví — typicky proto, že mu
      // tahle stránka zůstala otevřená ve druhé záložce. Chybu hlásit nemá
      // smysl, stačí načíst stránku znovu a paywall zmizí.
      if (response.status === 409) {
        window.location.reload();
        return;
      }

      if (!response.ok || !data.ok || !data.url) {
        setFailed(true);
        setLoading(false);
        return;
      }

      // Platební stránka běží u Stripu, ne u nás.
      window.location.href = data.url as string;
    } catch {
      setFailed(true);
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="display text-2xl">{t("title")}</h2>
      <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("subtitle")}
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {billingPeriods.map((option) => {
          const price = priceFor(locale, option);
          const selected = option === period;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              aria-pressed={selected}
              className={`rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-[color-mix(in_oklab,var(--color-lime-glow)_55%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_8%,transparent)]"
                  : "border-white/10 hover:border-white/25"
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
                {t(`period.${option}`)}
              </span>
              <span className="display mt-2 block text-2xl">
                {price.amount}
              </span>
              <span className="mt-1 block text-sm text-[var(--color-paper-dim)]">
                {t(`per.${option}`)}
              </span>
              {option === "yearly" && (
                <span className="mt-3 inline-block rounded-full border border-[color-mix(in_oklab,var(--color-lime-glow)_35%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-lime-soft)]">
                  {t("yearlySaving", { months: YEARLY_MONTHS_FREE })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ul className="mt-7 space-y-2.5">
        {(t.raw("includes") as string[]).map((item) => (
          <li key={item} className="flex gap-3 text-[15px]">
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 fill-none stroke-[var(--color-lime-soft)] stroke-[1.8]"
            >
              <path
                d="M4 10.5 8 14.5 16 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[var(--color-paper-dim)]">{item}</span>
          </li>
        ))}
      </ul>

      {failed && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {t("failed")}
        </p>
      )}

      {/* Prohlášení u tlačítka, ne zaškrtávátko navíc. Úkonem je samo
          kliknutí — uživatel má text před očima ve chvíli, kdy ho činí,
          a nestojí ho to krok navíc. Potvrzení pak dostane e-mailem. */}
      <p className="mt-7 text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {t("immediateStart")}
      </p>

      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="btn-primary mt-5 w-full"
      >
        {loading ? t("redirecting") : t("cta")}
      </button>

      <p className="mt-3 text-center text-xs leading-relaxed text-[var(--color-paper-faint)]">
        {t("note")}
      </p>
    </div>
  );
}
