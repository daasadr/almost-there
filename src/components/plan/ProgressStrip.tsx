import { getTranslations } from "next-intl/server";
import type { DayProgress } from "@/lib/goals/checkin";

/**
 * Posledních třicet dní jako proužek.
 *
 * Jediné místo v aplikaci, kde je vidět delší běh než jeden den. Smysl
 * není v přesných číslech — je v tom, aby člověk viděl, že to dělá
 * pravidelně, i když si na jednotlivé dny nevzpomene.
 *
 * Dny bez plánu zůstávají prázdné a nepočítají se jako neúspěch. Volno
 * podle plánu není nic, za co by se mělo trestat.
 */
export async function ProgressStrip({
  days,
  locale,
}: {
  days: DayProgress[];
  locale: string;
}) {
  const planned = days.filter((day) => day.total > 0);
  if (planned.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "plan.progress" });
  const format = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
  });

  const fullDays = planned.filter((day) => day.done === day.total).length;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
          {t("title")}
        </h2>
        <span className="text-xs text-[var(--color-paper-faint)]">
          {t("summary", { done: fullDays, total: planned.length })}
        </span>
      </div>

      <ol className="mt-3 flex gap-[3px]">
        {days.map((day) => {
          const share = day.total > 0 ? day.done / day.total : 0;

          return (
            <li
              key={day.date}
              title={
                day.total > 0
                  ? `${format.format(new Date(`${day.date}T12:00:00Z`))} — ${day.done}/${day.total}`
                  : format.format(new Date(`${day.date}T12:00:00Z`))
              }
              className="h-8 flex-1 overflow-hidden rounded-[3px] bg-white/[0.06]"
            >
              {day.total > 0 && (
                <span
                  aria-hidden="true"
                  className="block w-full bg-gradient-to-t from-[var(--color-emerald-soft)] to-[var(--color-lime-soft)]"
                  style={{
                    // Odspodu nahoru: i jeden hotový úkol je vidět.
                    height: `${Math.max(12, Math.round(share * 100))}%`,
                    marginTop: `${100 - Math.max(12, Math.round(share * 100))}%`,
                    opacity: share === 0 ? 0.18 : 1,
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
