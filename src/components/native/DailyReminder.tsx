"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Denní připomínka jako systémové oznámení.
 *
 * Telefon napíše ve zvolený čas, i když je aplikace zavřená. To je pro
 * appku, která se má otevřít každé ráno, rozdíl mezi zvykem a ikonou,
 * na kterou si člověk za týden vzpomene.
 *
 * Oznámení se plánuje v telefonu, ne na serveru: nic neodchází ven,
 * funguje to bez signálu a nemáme kde uchovávat, kdy kdo vstává.
 *
 * Volba se proto taky ukládá jen v tom telefonu. Kdo má appku na dvou
 * zařízeních, nastaví si to na každém zvlášť — a to je správně: budík
 * patří k přístroji, ne k účtu.
 *
 * Text oznámení schválně neříká, co konkrétně má uživatel v plánu. Názvy
 * úkolů máme v databázi šifrované a nemá smysl je pak vysvítit na
 * zamčenou obrazovku, kam vidí každý, kdo jde kolem stolu.
 */

/** Volba připomínky. Jen v tomhle telefonu. */
const STORAGE_KEY = "almostthere:reminder";

/** Pevné číslo oznámení — přeplánování má nahradit to staré, ne přidat další. */
const NOTIFICATION_ID = 1;

const DEFAULT_TIME = "08:00";

type State = { enabled: boolean; time: string };

function readStored(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: false, time: DEFAULT_TIME };
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      enabled: parsed.enabled === true,
      // Cizí obsah z úložiště se ověřuje tvarem — rozbitá hodnota by
      // jinak propadla až do plánování a to by spadlo.
      time: /^\d{2}:\d{2}$/.test(parsed.time ?? "") ? parsed.time! : DEFAULT_TIME,
    };
  } catch {
    return { enabled: false, time: DEFAULT_TIME };
  }
}

export function DailyReminder() {
  const t = useTranslations("plan.reminder");

  // `null` znamená „ještě nevíme" — v prohlížeči se nevykreslí nic.
  const [isNative, setIsNative] = useState<boolean | null>(null);
  const [state, setState] = useState<State>({ enabled: false, time: DEFAULT_TIME });
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  /**
   * Naplánování v telefonu.
   *
   * Staré oznámení se nejdřív ruší: kdyby se jen přidávalo, po každé změně
   * času by přibyl další budík a uživatel by dostal několik zpráv denně.
   */
  const schedule = useCallback(
    async (next: State) => {
      const { LocalNotifications } = await import(
        "@capacitor/local-notifications"
      );

      await LocalNotifications.cancel({
        notifications: [{ id: NOTIFICATION_ID }],
      });

      if (!next.enabled) return true;

      // Android 13 a novější se musí zeptat. Bez svolení se nedá dělat nic
      // a je slušné to říct rovnou, ne mlčky nic nenaplánovat.
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display !== "granted") {
        setDenied(true);
        return false;
      }
      setDenied(false);

      const [hour, minute] = next.time.split(":").map(Number);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_ID,
            title: t("notifyTitle"),
            body: t("notifyBody"),
            schedule: {
              on: { hour, minute },
              repeats: true,
              // Ať zpráva dorazí, i když telefon zrovna spí. Bez tohohle
              // ji systém odloží třeba na poledne a ranní připomínka
              // ztratí smysl.
              allowWhileIdle: true,
            },
          },
        ],
      });

      return true;
    },
    [t],
  );

  // Zjištění, jestli běžíme v aplikaci z obchodu. V prohlížeči plugin
  // neexistuje, takže se sem nesmí sáhnout dřív, než to víme.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (cancelled) return;

      const native = Capacitor.isNativePlatform();
      setIsNative(native);
      if (!native) return;

      const stored = readStored();
      setState(stored);

      // Přeplánování při každém otevření: pokryje restart telefonu,
      // přeinstalaci i změnu jazyka, po které by oznámení zůstalo
      // v tom původním.
      if (stored.enabled) await schedule(stored);
    })();

    return () => {
      cancelled = true;
    };
  }, [schedule]);

  if (!isNative) return null;

  const apply = async (next: State) => {
    setBusy(true);
    try {
      const ok = await schedule(next);
      // Když svolení nedorazí, přepínač se nesmí tvářit jako zapnutý.
      const applied = ok ? next : { ...next, enabled: false };
      setState(applied);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applied));
    } catch (error) {
      console.error("[reminder] naplánování selhalo", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card mt-8 p-6 sm:p-8">
      <h2 className="display text-xl">{t("title")}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      <label className="mt-6 flex items-start gap-3">
        <input
          type="checkbox"
          checked={state.enabled}
          disabled={busy}
          onChange={(event) =>
            void apply({ ...state, enabled: event.target.checked })
          }
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-lime-soft)]"
        />
        <span className="text-[15px] text-[var(--color-paper)]">
          {t("enable")}
        </span>
      </label>

      {state.enabled && (
        <label className="mt-5 block">
          <span className="text-sm text-[var(--color-paper-dim)]">
            {t("time")}
          </span>
          <input
            type="time"
            value={state.time}
            disabled={busy}
            onChange={(event) =>
              void apply({ ...state, time: event.target.value })
            }
            className="mt-2 block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[15px] text-[var(--color-paper)]"
          />
        </label>
      )}

      {denied && (
        <p className="mt-5 text-sm leading-relaxed text-amber-200/90">
          {t("denied")}
        </p>
      )}
    </section>
  );
}
