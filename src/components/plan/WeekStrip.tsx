import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { WeekDay } from "@/lib/goals/checkin";

/**
 * Týden nahoře: kde jsem plnil a kde jsem vypadl.
 *
 * Bez tohohle vidí uživatel jen dnešek a o svém běhu neví nic — a přitom
 * právě pohled na řadu odškrtnutých dní je to, co ho udrží. Zároveň je to
 * navigace: kliknutím se dostane do minulého i do už rozfázovaného
 * budoucího dne, aniž by musel hledat kudy.
 *
 * Dny bez plánu zůstávají prázdné a netváří se jako selhání. Volno podle
 * plánu ani den, na který se ještě nedošlo, není nic, co by se mělo
 * počítat proti člověku.
 */
export async function WeekStrip({
  days,
  selected,
  locale,
}: {
  days: WeekDay[];
  /** Datum, jehož úkoly se právě zobrazují. */
  selected: string;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "plan.week" });

  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dayNumber = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const full = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const previous = shiftWeek(days[0].date, -7);
  const next = shiftWeek(days[0].date, 7);

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/${locale}/app?day=${previous}`}
          aria-label={t("previous")}
          className="rounded-full border border-white/10 px-3 py-1 text-sm text-[var(--color-paper-faint)] transition hover:border-white/25 hover:text-[var(--color-paper)]"
        >
          ←
        </Link>

        <ol className="flex flex-1 justify-between gap-1.5">
          {days.map((day) => {
            const date = new Date(`${day.date}T12:00:00Z`);
            const complete = day.total > 0 && day.done === day.total;
            const partial = day.total > 0 && day.done > 0 && !complete;
            const missed = day.total > 0 && day.done === 0 && !day.isFuture;

            return (
              <li key={day.date} className="flex-1">
                <Link
                  href={`/${locale}/app?day=${day.date}`}
                  aria-label={full.format(date)}
                  aria-current={day.date === selected ? "date" : undefined}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2 transition ${
                    day.date === selected
                      ? "border-[color-mix(in_oklab,var(--color-lime-glow)_50%,transparent)] bg-white/[0.04]"
                      : "border-transparent hover:border-white/15"
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider text-[var(--color-paper-faint)]">
                    {weekday.format(date)}
                  </span>

                  {/* Stav dne: háček za hotový, kolečko za rozdělaný,
                      prázdno tam, kde nebylo co dělat. */}
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                      complete
                        ? "border-transparent bg-[var(--color-lime-soft)] text-[var(--color-ink-950)]"
                        : partial
                          ? "border-[var(--color-lime-soft)] text-[var(--color-lime-soft)]"
                          : missed
                            ? "border-white/25 text-[var(--color-paper-faint)]"
                            : "border-white/10 text-[var(--color-paper-faint)]"
                    }`}
                  >
                    {complete ? "✓" : dayNumber.format(date)}
                  </span>

                  {day.isToday && (
                    <span className="h-1 w-1 rounded-full bg-[var(--color-lime-soft)]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>

        <Link
          href={`/${locale}/app?day=${next}`}
          aria-label={t("next")}
          className="rounded-full border border-white/10 px-3 py-1 text-sm text-[var(--color-paper-faint)] transition hover:border-white/25 hover:text-[var(--color-paper)]"
        >
          →
        </Link>
      </div>
    </section>
  );
}

function shiftWeek(date: string, days: number): string {
  const shifted = new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000);
  return shifted.toISOString().slice(0, 10);
}
