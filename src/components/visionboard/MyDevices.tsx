"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";

/**
 * Zařízení, na kterých běží Vision Board.
 *
 * Načítá se z prohlížeče schválně. Stránka Extra je veřejná a generuje
 * se při sestavení; kdyby se na ní sáhlo na přihlášení, vykreslovala by
 * se při každém požadavku — a to kvůli oddílu, který nepřihlášený
 * stejně neuvidí.
 *
 * Nepřihlášenému se nevykreslí nic. Není to tajemství, jen by mu to
 * nic neříkalo: nemá co odebírat a výzvu k vyzkoušení Vision Boardu
 * nese zbytek stránky.
 */

type Device = {
  id: string;
  platform: string;
  activatedAt: string;
};

type State =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "ready"; devices: Device[] };

export function MyDevices() {
  const t = useTranslations("visionboard.devices");
  const format = useFormatter();

  const [state, setState] = useState<State>({ status: "loading" });
  const [removing, setRemoving] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    void fetch("/api/visionboard/devices")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!alive) return;
        setState(
          data?.signedIn
            ? { status: "ready", devices: data.devices ?? [] }
            : { status: "anonymous" },
        );
      })
      .catch(() => {
        // Výpadek sítě na veřejné stránce nemá nic hlásit; oddíl se
        // prostě neukáže.
        if (alive) setState({ status: "anonymous" });
      });

    return () => {
      alive = false;
    };
  }, []);

  const remove = async (id: string) => {
    setRemoving(id);
    setFailed(false);

    try {
      const response = await fetch(`/api/visionboard/devices/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("failed");

      setState((current) =>
        current.status === "ready"
          ? {
              status: "ready",
              devices: current.devices.filter((device) => device.id !== id),
            }
          : current,
      );
    } catch {
      setFailed(true);
    } finally {
      setRemoving(null);
    }
  };

  // Dokud se neví, jestli je kdo přihlášený, nic neproblikne.
  if (state.status !== "ready") return null;

  return (
    <section className="card mt-10 p-5 sm:p-6">
      <h2 className="display text-lg">{t("title")}</h2>
      <p className="mt-1.5 text-base leading-relaxed text-[var(--color-paper-dim)]">
        {t("body", { max: 3 })}
      </p>

      {state.devices.length === 0 ? (
        <p className="mt-5 text-sm leading-relaxed text-[var(--color-paper-faint)]">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {state.devices.map((device) => (
            <li
              key={device.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-edge p-4"
            >
              <span className="text-base text-[var(--color-paper)]">
                {t(`platforms.${device.platform}`)}
              </span>
              <span className="text-xs tabular-nums text-[var(--color-paper-faint)]">
                {t("since", {
                  date: format.dateTime(new Date(device.activatedAt), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
                })}
              </span>
              <button
                type="button"
                onClick={() => void remove(device.id)}
                disabled={removing !== null}
                className="text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline disabled:opacity-50"
              >
                {removing === device.id ? t("removing") : t("remove")}
              </button>
            </li>
          ))}
        </ul>
      )}

      {failed && (
        <p role="alert" className="mt-4 text-sm text-[var(--color-danger)]">
          {t("failed")}
        </p>
      )}

      {state.devices.length > 0 && (
        <p className="mt-4 text-xs leading-relaxed text-[var(--color-paper-faint)]">
          {t("removeNote")}
        </p>
      )}
    </section>
  );
}
