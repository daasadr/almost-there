import { useTranslations } from "next-intl";

type DayItem = { type: "action" | "rest" | "reflection"; text: string };

/**
 * Referenční ukázka rozpadu z bodu 6a zadání: měsíce → týdny → jeden den.
 *
 * Zároveň slouží jako hranice mezi demem a plnou verzí — týdenní a denní
 * úroveň jsou viditelně označené jako "jen v plné verzi", takže je z landing
 * page hned jasné, co si člověk kupuje.
 */
export function ExampleBreakdown() {
  const t = useTranslations("example");
  const months = t.raw("months") as string[];
  const weeks = t.raw("weeks") as string[];
  const days = t.raw("days") as DayItem[];

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl reveal">
          <p className="eyebrow">01</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-[var(--color-paper-dim)]">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          {/* Úroveň 1 — měsíce. Tohle vidí i uživatel v demu. */}
          <ol className="card reveal divide-y divide-white/5 p-2">
            {months.map((milestone, index) => (
              <li key={milestone} className="flex gap-4 p-5">
                <span className="display shrink-0 text-sm text-[var(--color-lime-soft)]">
                  {t("monthLabel", { n: index + 1 })}
                </span>
                <p className="text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
                  {milestone}
                </p>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-5">
            {/* Úroveň 2 — týdny */}
            <div
              className="card reveal p-6"
              style={{ transitionDelay: "80ms" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="display text-lg">{t("weekTitle")}</h3>
                <FullOnlyBadge label={t("fullOnly")} />
              </div>
              <ol className="mt-4 space-y-2.5">
                {weeks.map((week, index) => (
                  <li key={week} className="flex gap-3 text-[15px]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-emerald-soft)]" />
                    <span className="text-[var(--color-paper-dim)]">
                      <span className="text-[var(--color-paper-faint)]">
                        {index + 1}.
                      </span>{" "}
                      {week}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Úroveň 3 — konkrétní den, včetně reflexe jako plnohodnotné položky */}
            <div
              className="card reveal p-6"
              style={{ transitionDelay: "160ms" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="display text-lg">{t("dayTitle")}</h3>
                <FullOnlyBadge label={t("fullOnly")} />
              </div>
              <ul className="mt-4 space-y-3">
                {days.map((day) => (
                  <li key={day.text} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        day.type === "reflection"
                          ? "border-[color-mix(in_oklab,var(--color-violet-soft)_50%,transparent)]"
                          : "border-white/20"
                      }`}
                    />
                    <span className="text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
                      {day.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FullOnlyBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[color-mix(in_oklab,var(--color-violet-soft)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-violet-glow)_12%,transparent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-violet-soft)]">
      {label}
    </span>
  );
}
