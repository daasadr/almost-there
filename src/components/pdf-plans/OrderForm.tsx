"use client";

import { useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  formatPrice,
  MAX_WEEKS,
  MIN_WEEKS,
  priceFor,
  weeksAllowed,
} from "@/lib/pdf-plans/pricing";
import { weeksBetween } from "@/lib/pdf-plans/order";
import { WEEKEND } from "@/lib/pdf-plans/rest-days";
import type { Granularity } from "@/lib/pdf-plans/plan";
import type { Locale } from "@/i18n/routing";

/**
 * Zadání a platba jednorázového plánu.
 *
 * Cena se počítá i tady, aby ji člověk viděl měnit se s termínem —
 * ale na serveru se počítá znovu a platí ta jeho. Tahle je jen
 * zobrazení; kdyby se poslala v požadavku, dala by se přepsat.
 *
 * Záměrně jediná obrazovka. Mezi rozhodnutím a platbou nemá stát
 * průvodce o třech krocích.
 */

const HOURS = [2, 4, 6, 8, 10, 15, 20];

/** Dny v týdnu od pondělí, jak je lidé čtou. Hodnota je číslo dne. */
const DAYS = [1, 2, 3, 4, 5, 6, 0];

export function OrderForm({
  templateId,
  defaultGoal,
  suggestedWeeks,
  granularity,
  signedIn,
  today,
}: {
  templateId?: string;
  defaultGoal: string;
  suggestedWeeks: number;
  granularity: Granularity;
  signedIn: boolean;
  /** Dnešek v pásmu uživatele, RRRR-MM-DD. Posílá server. */
  today: string;
}) {
  const t = useTranslations("pdfPlans");
  const locale = useLocale() as Locale;
  const ids = useId();

  const [goal, setGoal] = useState(defaultGoal);
  const [date, setDate] = useState(() => isoPlusWeeks(today, suggestedWeeks));
  const [hours, setHours] = useState(6);
  const [context, setContext] = useState("");
  const [start, setStart] = useState("");
  /*
   * Víkend předvyplněný, ale ne vnucený. Většina lidí ho chce volný,
   * kdo dělá na směny nebo má děti každý druhý týden si to přepne —
   * a plán, který zabere jediné volné odpoledne, skončí v koši.
   */
  const [restDays, setRestDays] = useState<number[]>(WEEKEND);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const weeks = useMemo(() => weeksBetween(today, date), [today, date]);
  const price = weeksAllowed(weeks, granularity)
    ? priceFor(weeks, locale, granularity)
    : null;

  const ready =
    goal.trim().length >= 10 && price !== null && consent && !sending;

  const submit = async () => {
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/pdf-plans/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goal.trim(),
          description: context.trim() || undefined,
          startingPoint: start.trim() || undefined,
          templateId,
          hoursPerWeek: hours,
          targetDate: date,
          restDays,
          consent,
          locale,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok || !data.url) {
        setError(errorKey(data?.error));
        setSending(false);
        return;
      }

      // Odchod k pokladně. `sending` se schválně nevrací zpátky:
      // stránka se mění a blikající tlačítko by vypadalo jako chyba.
      window.location.href = data.url;
    } catch {
      setError("generic");
      setSending(false);
    }
  };

  if (!signedIn) {
    return (
      <div className="card mt-8 p-5 sm:p-6">
        <p className="text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("signInWhy")}
        </p>
        <a
          href={`/${locale}/login?callbackUrl=${encodeURIComponent(
            `/${locale}/pdf-plans/${templateId ?? "custom"}`,
          )}`}
          className="btn-primary mt-4 inline-flex"
        >
          {t("signIn")}
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <Field
        id={`${ids}-goal`}
        label={t("goalLabel")}
        hint={t("goalHint")}
      >
        <textarea
          id={`${ids}-goal`}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          maxLength={200}
          className="w-full rounded-xl border border-edge bg-surface p-3 text-base leading-relaxed text-[var(--color-paper)]"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={`${ids}-date`} label={t("dateLabel")} hint={t("dateHint")}>
          <input
            id={`${ids}-date`}
            type="date"
            value={date}
            min={isoPlusWeeks(today, MIN_WEEKS)}
            max={isoPlusWeeks(today, MAX_WEEKS[granularity])}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-edge bg-surface p-3 text-base text-[var(--color-paper)]"
          />
        </Field>

        <Field id={`${ids}-hours`} label={t("hoursLabel")}>
          <select
            id={`${ids}-hours`}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full rounded-xl border border-edge bg-surface p-3 text-base text-[var(--color-paper)]"
          >
            {HOURS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Jen u podrobného plánu. U týdenního si den volí člověk sám,
          takže ptát se na volno by bylo matoucí. */}
      {granularity === "daily" && (
        <div>
          <span className="block text-base font-medium text-[var(--color-paper)]">
            {t("restLabel")}
          </span>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-paper-faint)]">
            {t("restHint")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const on = restDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setRestDays((current) =>
                      current.includes(day)
                        ? current.filter((d) => d !== day)
                        : [...current, day],
                    )
                  }
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    on
                      ? "border-[var(--color-lime-soft)] bg-surface text-[var(--color-paper)]"
                      : "border-edge text-[var(--color-paper-faint)] hover:border-edge-hover"
                  }`}
                >
                  {t(`weekday.${day}`)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Field
        id={`${ids}-start`}
        label={t("startLabel")}
        hint={t("startHint")}
      >
        <textarea
          id={`${ids}-start`}
          value={start}
          onChange={(e) => setStart(e.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full rounded-xl border border-edge bg-surface p-3 text-base leading-relaxed text-[var(--color-paper)]"
        />
      </Field>

      <Field
        id={`${ids}-context`}
        label={t("contextLabel")}
        hint={t("contextHint")}
      >
        <textarea
          id={`${ids}-context`}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full rounded-xl border border-edge bg-surface p-3 text-base leading-relaxed text-[var(--color-paper)]"
        />
      </Field>

      {/* Souhlas není formalita schovaná pod odkazem: bez něj
          nezaniká lhůta na odstoupení a nesmí se dát přehlédnout. */}
      <div className="rounded-xl border border-edge p-4">
        <label className="flex items-start gap-3 text-base leading-relaxed text-[var(--color-paper)]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>{t("consentLabel")}</span>
        </label>
        <p className="mt-2 pl-7 text-sm text-[var(--color-paper-faint)]">
          {t("consentWhy")}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-[var(--color-danger)]"
        >
          {t(`errors.${error}`)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={submit}
          disabled={!ready}
          className="btn-primary disabled:opacity-50"
        >
          {sending
            ? t("sending")
            : t("buy", {
                price: price ? formatPrice(price, locale) : "—",
              })}
        </button>

        {price && (
          <span className="text-sm text-[var(--color-paper-faint)]">
            {t("weeksSummary", {
              weeks,
              price: formatPrice(price, locale),
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-base font-medium text-[var(--color-paper)]">
        {label}
      </label>
      {hint && (
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-paper-faint)]">
          {hint}
        </p>
      )}
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Datum o daný počet týdnů dál, ve tvaru RRRR-MM-DD. */
function isoPlusWeeks(iso: string, weeks: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

/** Kódy, na které máme hlášku. Neznámé spadnou na obecnou. */
const KNOWN = new Set([
  "titleTooShort",
  "titleTooLong",
  "textTooLong",
  "hoursOutOfRange",
  "dateTooSoon",
  "dateTooFar",
  "consentRequired",
  "restDaysInvalid",
  "tooMany",
]);

function errorKey(value: unknown): string {
  return typeof value === "string" && KNOWN.has(value) ? value : "generic";
}
