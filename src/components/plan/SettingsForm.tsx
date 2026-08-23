"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

/**
 * Předvolby, ze kterých se staví plán.
 *
 * Hodnoty se nabízejí jako výběr, ne jako číselník. „Kolik minut denně“
 * není otázka, na kterou má někdo přesnou odpověď — a z volby mezi
 * půlhodinou a hodinou vyjde stejně dobrý plán jako z čísla 47.
 */

const CAPACITY_CHOICES = [15, 30, 45, 60, 90, 120, 180, 240, 360];
const REFLECTION_CHOICES = [0, 5, 10, 15, 20, 30];
const REST_CHOICES = [
  "NONE",
  "ONE_DAY_PER_WEEK",
  "TWO_DAYS_PER_WEEK",
  "EVERY_OTHER_DAY",
] as const;

/** Záloha pro prohlížeče bez `Intl.supportedValuesOf`. */
const FALLBACK_ZONES = [
  "Europe/Prague",
  "Europe/Bratislava",
  "Europe/Berlin",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/London",
  "Europe/Madrid",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

const textareaClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] leading-relaxed text-[var(--color-paper)] transition placeholder:text-[var(--color-paper-faint)] focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] disabled:opacity-60";

const selectClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] text-[var(--color-paper)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] disabled:opacity-60 sm:w-auto";

export function SettingsForm({
  initial,
  backToGoal = false,
}: {
  /** Přišel sem uživatel od rozepsaného cíle? Pak ho tam vrátíme. */
  backToGoal?: boolean;
  initial: {
    dailyCapacityMinutes: number;
    reflectionMinutesDay: number;
    restFrequency: string;
    timezone: string;
    rewardLikes: string | null;
    rewardDislikes: string | null;
  };
}) {
  const t = useTranslations("plan.settings");
  const router = useRouter();
  const locale = useLocale();

  const [capacity, setCapacity] = useState(initial.dailyCapacityMinutes);
  const [reflection, setReflection] = useState(initial.reflectionMinutesDay);
  const [rest, setRest] = useState(initial.restFrequency);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [likes, setLikes] = useState(initial.rewardLikes ?? "");
  const [dislikes, setDislikes] = useState(initial.rewardDislikes ?? "");

  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const zones = useMemo(() => {
    const supported =
      typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("timeZone")
        : FALLBACK_ZONES;

    // Uložené pásmo musí být v seznamu, i kdyby ho prohlížeč neznal —
    // jinak by se výběr tiše přepnul na první položku.
    return supported.includes(timezone) ? supported : [timezone, ...supported];
  }, [timezone]);

  const detected = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return null;
    }
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setError(false);

    try {
      const response = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyCapacityMinutes: capacity,
          reflectionMinutesDay: reflection,
          restFrequency: rest,
          timezone,
          rewardLikes: likes,
          rewardDislikes: dislikes,
        }),
      });
      if (!response.ok) throw new Error("save failed");

      setSaved(true);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div>
        <label htmlFor="capacity" className="block text-sm font-medium">
          {t("capacityLabel")}
        </label>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
          {t("capacityHint")}
        </p>
        <select
          id="capacity"
          value={capacity}
          disabled={pending}
          onChange={(event) => setCapacity(Number(event.target.value))}
          className={selectClass}
        >
          {CAPACITY_CHOICES.map((minutes) => (
            <option
              key={minutes}
              value={minutes}
              className="bg-[var(--color-ink-900)]"
            >
              {t("minutes", { minutes })}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8">
        <label htmlFor="rest" className="block text-sm font-medium">
          {t("restLabel")}
        </label>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
          {t("restHint")}
        </p>
        <select
          id="rest"
          value={rest}
          disabled={pending}
          onChange={(event) => setRest(event.target.value)}
          className={selectClass}
        >
          {REST_CHOICES.map((option) => (
            <option
              key={option}
              value={option}
              className="bg-[var(--color-ink-900)]"
            >
              {t(`rest.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8">
        <label htmlFor="reflection" className="block text-sm font-medium">
          {t("reflectionLabel")}
        </label>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
          {t("reflectionHint")}
        </p>
        <select
          id="reflection"
          value={reflection}
          disabled={pending}
          onChange={(event) => setReflection(Number(event.target.value))}
          className={selectClass}
        >
          {REFLECTION_CHOICES.map((minutes) => (
            <option
              key={minutes}
              value={minutes}
              className="bg-[var(--color-ink-900)]"
            >
              {minutes === 0 ? t("noReflection") : t("minutes", { minutes })}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8">
        <label htmlFor="timezone" className="block text-sm font-medium">
          {t("timezoneLabel")}
        </label>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
          {t("timezoneHint")}
        </p>
        <select
          id="timezone"
          value={timezone}
          disabled={pending}
          onChange={(event) => setTimezone(event.target.value)}
          className={selectClass}
        >
          {zones.map((zone) => (
            <option key={zone} value={zone} className="bg-[var(--color-ink-900)]">
              {zone}
            </option>
          ))}
        </select>

        {detected && detected !== timezone && (
          <button
            type="button"
            onClick={() => setTimezone(detected)}
            className="mt-2 block text-xs text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
          >
            {t("useDetected", { zone: detected })}
          </button>
        )}
      </div>

      {/* Podklad pro návrhy odměn za milníky. Volný text schválně —
          výběr z nabídky by lidi natlačil do škatulek, které jsme
          vymysleli my, a odměna z cizí škatulky nemotivuje. */}
      <div className="mt-9 border-t border-white/5 pt-9">
        <h2 className="text-sm font-semibold text-[var(--color-paper)]">
          {t("rewardsTitle")}
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
          {t("rewardsHint")}
        </p>

        <label htmlFor="likes" className="mt-6 block text-sm font-medium">
          {t("likesLabel")}
        </label>
        <textarea
          id="likes"
          value={likes}
          disabled={pending}
          rows={3}
          maxLength={600}
          placeholder={t("likesPlaceholder")}
          onChange={(event) => setLikes(event.target.value)}
          className={textareaClass}
        />

        <label htmlFor="dislikes" className="mt-5 block text-sm font-medium">
          {t("dislikesLabel")}
        </label>
        <textarea
          id="dislikes"
          value={dislikes}
          disabled={pending}
          rows={3}
          maxLength={600}
          placeholder={t("dislikesPlaceholder")}
          onChange={(event) => setDislikes(event.target.value)}
          className={textareaClass}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-7 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {t("failed")}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? t("saving") : t("save")}
        </button>
        {saved && !pending && (
          <span className="text-sm text-[var(--color-lime-soft)]">
            {t("saved")}
          </span>
        )}

        {/* Nejviditelnější cesta zpátky vede tam, odkud uživatel přišel.
            Bez ní zůstal stát na uložené stránce a klikl na „zpět do
            aplikace“, čímž o rozepsaný cíl přišel. */}
        {backToGoal && saved && !pending && (
          <Link
            href={`/${locale}/app/goals/new`}
            className="btn-primary !px-5 !py-2 text-sm"
          >
            {t("backToGoal")}
          </Link>
        )}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[var(--color-paper-faint)]">
        {t("appliesNote")}
      </p>
    </form>
  );
}
