import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { CalendarDay } from "@/lib/goals/checkin";

/**
 * Měsíc v mřížce.
 *
 * Týdenní proužek nad dnešními úkoly ukáže sedm dní a víc se tam nevejde.
 * Kdo chce vidět, jak mu šel celý měsíc — kde byla řada a kde díra — musel
 * dosud listovat po týdnech. Tady je to najednou.
 *
 * Barva okénka říká, jak den dopadl; číslo v něm je datum, aby se dal
 * najít podle kalendáře na zdi, ne jen podle pořadí. Klepnutím se otevřou
 * úkoly toho dne, stejnou cestou jako z týdenního proužku.
 *
 * Vynechaný den je schválně vidět. Není to výtka — je to jediný způsob,
 * jak poznat rozdíl mezi „tenhle týden mi nešel“ a „tenhle týden jsem
 * měl volno“, a bez toho rozdílu se z přehledu nedá nic vyčíst.
 */

/** Posun o měsíc, vstup i výstup ve tvaru YYYY-MM. */
function shiftMonth(month: string, by: number): string {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, index - 1 + by, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function MonthCalendar({
  days,
  month,
  locale,
}: {
  days: CalendarDay[];
  /** YYYY-MM */
  month: string;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "plan.calendar" });

  const monthName = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T12:00:00Z`));

  const dayNumber = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const fullDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Zkratky dnů v týdnu vezmeme z prvního týdne mřížky — ta vždy začíná
  // pondělkem, takže je není potřeba psát ručně pro každý jazyk.
  const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: "short" });

  // Souhrn jen za dny toho měsíce, které měly co plnit.
  const planned = days.filter((day) => day.inMonth && day.total > 0);
  const completeCount = planned.filter((day) => day.done === day.total).length;

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/${locale}/app/calendar?month=${shiftMonth(month, -1)}`}
          aria-label={t("previous")}
          className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-[var(--color-paper-faint)] transition hover:border-white/25 hover:text-[var(--color-paper)]"
        >
          ←
        </Link>

        <h2 className="display text-center text-xl capitalize sm:text-2xl">
          {monthName}
        </h2>

        <Link
          href={`/${locale}/app/calendar?month=${shiftMonth(month, 1)}`}
          aria-label={t("next")}
          className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-[var(--color-paper-faint)] transition hover:border-white/25 hover:text-[var(--color-paper)]"
        >
          →
        </Link>
      </div>

      {planned.length > 0 && (
        <p className="mt-2 text-center text-sm text-[var(--color-paper-faint)]">
          {t("summary", { done: completeCount, total: planned.length })}
        </p>
      )}

      {/* Záhlaví se dny v týdnu. Pro čtečku je zbytečné — datum si každé
          okénko nese ve svém popisku — proto je schované. */}
      <ol
        aria-hidden="true"
        className="mt-6 grid grid-cols-7 gap-1.5 text-center text-[11px] uppercase tracking-wider text-[var(--color-paper-faint)]"
      >
        {days.slice(0, 7).map((day) => (
          <li key={`head-${day.date}`}>
            {weekdayShort.format(new Date(`${day.date}T12:00:00Z`))}
          </li>
        ))}
      </ol>

      <ol className="mt-2 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const date = new Date(`${day.date}T12:00:00Z`);
          const complete = day.total > 0 && day.done === day.total;
          const partial = day.total > 0 && day.done > 0 && !complete;
          const missed = day.total > 0 && day.done === 0 && !day.isFuture;

          const tone = complete
            ? "border-[color-mix(in_oklab,var(--color-lime-glow)_55%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_18%,transparent)] text-[var(--color-paper)]"
            : partial
              ? "border-[color-mix(in_oklab,var(--color-emerald-glow)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-emerald-glow)_10%,transparent)] text-[var(--color-paper)]"
              : missed
                ? "border-white/10 bg-white/[0.02] text-[var(--color-paper-faint)]"
                : "border-transparent text-[var(--color-paper-faint)]";

          const label = day.total
            ? `${fullDate.format(date)} — ${day.done}/${day.total}`
            : fullDate.format(date);

          return (
            <li key={day.date}>
              <Link
                href={`/${locale}/app?day=${day.date}`}
                aria-label={label}
                title={label}
                aria-current={day.isToday ? "date" : undefined}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition hover:border-white/30 ${tone} ${
                  // Dny sousedních měsíců jen dorovnávají mřížku.
                  day.inMonth ? "" : "opacity-30"
                } ${
                  day.isToday
                    ? "ring-2 ring-[var(--color-lime-soft)] ring-offset-2 ring-offset-[var(--color-ink-950)]"
                    : ""
                }`}
              >
                <span className="tabular-nums">{dayNumber.format(date)}</span>

                {/* Vynechaný den dostane tečku. Samotná barva by na
                    telefonu v ostrém světle nemusela být poznat, a kdo
                    barvy nerozlišuje, nepozná ji nikdy. */}
                {missed && (
                  <span
                    aria-hidden="true"
                    className="mt-1 h-1 w-1 rounded-full bg-[var(--color-paper-faint)]"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ol>

      <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[var(--color-paper-faint)]">
        <Legend
          className="border-[color-mix(in_oklab,var(--color-lime-glow)_55%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_18%,transparent)]"
          label={t("legendComplete")}
        />
        <Legend
          className="border-[color-mix(in_oklab,var(--color-emerald-glow)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-emerald-glow)_10%,transparent)]"
          label={t("legendPartial")}
        />
        <Legend
          className="border-white/10 bg-white/[0.02]"
          label={t("legendMissed")}
        />
        <Legend className="border-transparent" label={t("legendEmpty")} />
      </ul>
    </section>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`h-3.5 w-3.5 rounded-[5px] border ${className}`}
      />
      {label}
    </li>
  );
}
