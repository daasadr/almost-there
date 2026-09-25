"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { readStored } from "@/lib/safe-storage";
import { DEFAULT_THEME, isTheme, THEME_STORAGE_KEY } from "@/lib/theme";

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
    "saved" | "failed" | "blocked" | "unsupported" | null
  >(null);

  const save = async (next: { mode: Mode; time: string; evening: boolean }) => {
    setBusy(true);
    setNote(null);

    try {
      if (next.mode !== "OFF") {
        const ok = await subscribe(vapidPublicKey);
        if (ok !== true) {
          setNote(ok);
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
            value={mode}
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

        {mode !== "OFF" && (
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

/**
 * Přihlášení tohoto zařízení k odběru.
 *
 * Vrací `true`, nebo důvod, proč to nejde — ten se uživateli ukáže.
 * Zamítnuté svolení se z kódu vrátit nedá; prohlížeč si ho pamatuje
 * a odvolat ho může jen člověk ve svém nastavení.
 */
async function subscribe(
  vapidPublicKey: string,
): Promise<true | "blocked" | "unsupported"> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "blocked";

  const registration = await navigator.serviceWorker.ready;

  // Existující odběr se použije, nový se vytvoří. Odebírat podruhé
  // s jiným klíčem prohlížeč odmítne.
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      // Bez tohohle prohlížeče odběr nepovolí: oznámení musí být vždycky
      // vidět, nesmí se posílat tiše na pozadí.
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  const json = subscription.toJSON();
  const stored = readStored(THEME_STORAGE_KEY);

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      // Ať oznámení vypadá jako aplikace, kterou tu člověk zná.
      theme: isTheme(stored) ? stored : DEFAULT_THEME,
    }),
  });

  return true;
}

async function unsubscribe(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.ready;
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
  } catch {
    // Vypnutí připomínek se nesmí zaseknout na tom, že odhlášení
    // u prohlížeče selhalo. Rozhoduje nastavení na serveru.
  }
}

/**
 * Klíč z textové podoby do bajtů.
 *
 * VAPID klíč se předává jako base64url, ale `subscribe` chce pole bajtů.
 * Postup je daný specifikací a vypadá stejně v každé aplikaci, která
 * oznámení používá.
 */
function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);

  // Vlastní ArrayBuffer schválně: `new Uint8Array(délka)` má podle typů
  // obecný buffer, který `subscribe` nepřijme.
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
