"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { subscribe, unsubscribe } from "@/lib/push-subscribe";

/**
 * Nastavení připomínek pro web.
 *
 * Aplikace na dlouhé cíle stojí na tom, že ji člověk otevře i ve dnech,
 * kdy se mu nechce. Připomínka je jediná věc, která se o to postará,
 * když si sám nevzpomene — a právě ty dny rozhodují.
 *
 * Svolení k oznámením si vyžádá prohlížeč a musí to být v reakci na
 * klepnutí. Vyžádat si ho samo od sebe při načtení stránky prohlížeče
 * odmítají a lidé to nesnášejí; proto je to za tlačítkem.
 *
 * Android aplikace z obchodu má vlastní připomínky přes systém —
 * viz components/native/DailyReminder.tsx. Tohle je pro web.
 */

type Mode = "OFF" | "DAILY" | "WEEKLY";

export function NotifySettings({
  initial,
  vapidPublicKey,
}: {
  initial: { mode: Mode; time: string; evening: boolean };
  /** Veřejná půlka podpisového klíče. Bez ní se odebírat nedá. */
  vapidPublicKey: string;
}) {
  const t = useTranslations("plan.notify");

  const [mode, setMode] = useState<Mode>(initial.mode);
  const [time, setTime] = useState(initial.time);
  const [evening, setEvening] = useState(initial.evening);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<
    "saved" | "failed" | "blocked" | "dismissed" | "unsupported" | null
  >(null);

  /**
   * Co si uživatel vybral, když se to nepovedlo zapnout.
   *
   * Výběr je řízený uloženou hodnotou, takže při neúspěchu skákal zpátky
   * na „Nikdy“ — vypadalo to, jako by se volba zamkla, a hláška pod tím
   * se snadno přehlédla. Volba proto zůstane vidět a vedle ní stojí, proč
   * zatím neplatí. Po načtení stránky se ukáže skutečný uložený stav.
   */
  const [wanted, setWanted] = useState<Mode | null>(null);

  const save = async (next: { mode: Mode; time: string; evening: boolean }) => {
    setBusy(true);
    setNote(null);

    try {
      if (next.mode !== "OFF") {
        const ok = await subscribe(vapidPublicKey);
        if (ok !== true) {
          setNote(ok);
          setWanted(next.mode);
          setBusy(false);
          return;
        }
      } else {
        await unsubscribe();
      }

      const response = await fetch("/api/account/notify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("save failed");

      setMode(next.mode);
      setTime(next.time);
      setEvening(next.evening);
      setWanted(null);
      setNote("saved");
    } catch {
      setNote("failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-edge p-5 sm:p-6">
      <h2 className="display text-lg">{t("title")}</h2>
      <p className="mt-2 text-base leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="notify-mode"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]"
          >
            {t("modeLabel")}
          </label>
          <select
            id="notify-mode"
            value={wanted ?? mode}
            disabled={busy}
            onChange={(event) =>
              void save({ mode: event.target.value as Mode, time, evening })
            }
            className="mt-2 w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-base text-[var(--color-paper)] disabled:opacity-60"
          >
            <option value="OFF">{t("OFF")}</option>
            <option value="DAILY">{t("DAILY")}</option>
            <option value="WEEKLY">{t("WEEKLY")}</option>
          </select>
        </div>

        {(wanted ?? mode) !== "OFF" && (
          <>
            <div>
              <label
                htmlFor="notify-time"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]"
              >
                {t("timeLabel")}
              </label>
              <input
                id="notify-time"
                type="time"
                value={time}
                disabled={busy}
                onChange={(event) =>
                  void save({ mode, time: event.target.value, evening })
                }
                className="mt-2 rounded-xl border border-edge bg-surface px-4 py-2.5 text-base text-[var(--color-paper)] disabled:opacity-60"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                // Stav drží aplikace, ne paměť prohlížeče — viz TodayChecklist.
                autoComplete="off"
                checked={evening}
                disabled={busy}
                onChange={(event) =>
                  void save({ mode, time, evening: event.target.checked })
                }
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <span className="text-base leading-relaxed text-[var(--color-paper-dim)]">
                {t("eveningLabel")}
              </span>
            </label>
          </>
        )}
      </div>

      {note && (
        <p
          role="status"
          className={`mt-5 text-sm leading-relaxed ${
            note === "saved"
              ? "text-[var(--color-paper-faint)]"
              : "rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-amber-100/90"
          }`}
        >
          {t(note)}
        </p>
      )}
    </section>
  );
}
