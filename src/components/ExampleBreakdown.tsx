import { useTranslations } from "next-intl";
import { JourneyStage, type JourneyStrings } from "@/components/journey/JourneyStage";

type DayItem = { type: "action" | "rest" | "reflection"; text: string };

/**
 * Referenční ukázka rozpadu z bodu 6a zadání: měsíce → týdny → jeden den.
 *
 * Zároveň slouží jako hranice mezi demem a plnou verzí — týdenní a denní
 * úroveň jsou viditelně označené jako "jen v plné verzi", takže je z landing
 * page hned jasné, co si člověk kupuje.
 *
 * ── Dvě podoby téhož ────────────────────────────────────────────────
 *
 * Obsah je jeden, ale ukazuje se dvěma způsoby. `JourneyStage` z něj
 * udělá scénu, která se rozbaluje, jak člověk roluje, a dojde až ke
 * splněnému cíli; když se animovat nesmí nebo neběží JavaScript, zůstane
 * ten statický rozpad níž. Rozhoduje o tom scéna sama, proto je statická
 * verze její `children` a ne druhá sekce.
 */
export function ExampleBreakdown() {
  const t = useTranslations("example");
  const tJourney = useTranslations("journey");

  const months = t.raw("months") as string[];
  const weeks = t.raw("weeks") as string[];
  const days = t.raw("days") as DayItem[];

  /*
   * Texty pro scénu se čtou tady, na serveru, a posílají se jí v props.
   * Scéna běží v prohlížeči a klientské komponenty dostávají jen
   * vyjmenované oddíly překladů — tenhle mezi nimi schválně není, aby
   * se nemuselo hlídat, že v seznamu zůstal.
   */
  const strings: JourneyStrings = {
    sampleLabel: tJourney("sampleLabel"),
    scrollHint: tJourney("scrollHint"),
    goalLabel: tJourney("goalLabel"),
    goalTitle: tJourney("goalTitle"),
    deadlineLabel: tJourney("deadlineLabel"),
    deadline: tJourney("deadline"),
    steps: tJourney.raw("steps") as string[],
    todayLabel: tJourney("todayLabel"),
    checkTitle: tJourney("checkTitle"),
    checkBody: tJourney("checkBody"),
    checkYes: tJourney("checkYes"),
    checkNo: tJourney("checkNo"),
    doneTitle: tJourney("doneTitle"),
    doneBody: tJourney("doneBody"),
    doneStat: tJourney("doneStat"),
  };

  return (
    <section className="relative py-28 sm:py-40">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl reveal">
          <p className="eyebrow">01</p>
          <h2 className="display type-section mt-5">{t("title")}</h2>
          <p className="type-lead measure mt-6 text-[var(--color-paper-dim)]">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <JourneyStage
        strings={strings}
        months={months}
        weeks={weeks}
        days={days}
        monthLabel={months.map((_, index) => t("monthLabel", { n: index + 1 }))}
        weekLabel={weeks.map((_, index) =>
          tJourney("weekLabel", { n: index + 1 }),
        )}
        dayTitle={t("dayTitle")}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mt-14 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            {/* Úroveň 1 — měsíce. Tohle vidí i uživatel v demu. */}
            <ol className="card reveal divide-y divide-edge-faint p-2">
              {months.map((milestone, index) => (
                <li key={milestone} className="flex gap-4 p-5">
                  <span className="display shrink-0 text-sm text-[var(--color-lime-soft)]">
                    {t("monthLabel", { n: index + 1 })}
                  </span>
                  <p className="text-base leading-relaxed text-[var(--color-paper-dim)]">
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
                    <li key={week} className="flex gap-3 text-base">
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
                            : "border-edge-strong"
                        }`}
                      />
                      <span className="text-base leading-relaxed text-[var(--color-paper-dim)]">
                        {day.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </JourneyStage>
    </section>
  );
}

function FullOnlyBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[color-mix(in_oklab,var(--color-violet-soft)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-violet-glow)_12%,transparent)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-violet-soft)]">
      {label}
    </span>
  );
}
