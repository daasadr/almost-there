"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { readStored, writeStored } from "@/lib/safe-storage";
import { subscribe } from "@/lib/push-subscribe";

/**
 * Nabídka zapnout ranní myšlenku, pro toho, kdo připomínky nemá.
 *
 * Nastavení připomínek sedí v „Důležitých nastaveních“ a kdo tam
 * nezabloudí, nedozví se o nich. Přitom je to jediná věc, která člověka
 * do aplikace vrací sama od sebe — a u nového účtu je to ta nejlepší
 * chvíle se zeptat.
 *
 * ── Proč tlačítko, a ne rovnou dotaz prohlížeče ──────────────────────
 *
 * O svolení k oznámením se prohlížeč smí zeptat jen po kliknutí. Okénko,
 * které vyskočí samo, tedy udělat nejde — a bylo by to i špatně: kdo
 * dostane systémový dotaz bez vysvětlení, zamítne ho, a zamítnutí už
 * z kódu vrátit nelze. Tahle kartička je to vysvětlení předem. Teprve
 * kliknutí spustí dotaz prohlížeče.
 *
 * ── Jedno kliknutí, ne cesta do nastavení ────────────────────────────
 *
 * Tlačítko rovnou vyřídí svolení, odběr i uložení. Odkaz do nastavení by
 * znamenal tři kroky a na konci formulář, kde se to musí najít.
 *
 * ── Kdy se neukáže ───────────────────────────────────────────────────
 *
 * Když už připomínky běží, když je člověk odmítl, když oznámení zakázal
 * v prohlížeči nebo je prohlížeč neumí. Volba „teď ne“ se pamatuje
 * v zařízení, ne u účtu: svolení k oznámením je věc prohlížeče, takže
 * na notebooku má smysl se zeptat i toho, kdo to na telefonu odmítl.
 */

const DISMISSED_KEY = "almostthere.notify-invite";

export function NotifyInvite({ vapidPublicKey }: { vapidPublicKey: string }) {
  const t = useTranslations("plan.notifyInvite");
  const router = useRouter();

  // `null` = ještě nevíme. Kartička se do té doby nevykresluje, aby
  // neprobliskla a hned nezmizela.
  const [show, setShow] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<"blocked" | "generic" | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setShow(false);
      return;
    }

    // Zamítnuté svolení se odklikat nedá, tak o něj neprosíme podruhé.
    if (Notification.permission === "denied") {
      setShow(false);
      return;
    }

    setShow(readStored(DISMISSED_KEY) !== "1");
  }, []);

  const dismiss = () => {
    writeStored(DISMISSED_KEY, "1");
    setShow(false);
  };

  const enable = async () => {
    setBusy(true);
    setFailed(null);

    try {
      const ok = await subscribe(vapidPublicKey);
      if (ok !== true) {
        setFailed(ok === "blocked" ? "blocked" : "generic");
        setBusy(false);
        return;
      }

      const response = await fetch("/api/account/notify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Sedmá ráno a bez večerní kontroly. Čas i zbytek se dá doladit
        // v nastavení; tady jde o to, aby stačilo jedno kliknutí.
        body: JSON.stringify({ mode: "DAILY", time: "07:00", evening: false }),
      });
      if (!response.ok) throw new Error("save failed");

      writeStored(DISMISSED_KEY, "1");
      setShow(false);
      router.refresh();
    } catch {
      setFailed("generic");
    } finally {
      setBusy(false);
    }
  };

  if (!show) return null;

  return (
    <div className="card border-l-[3px] border-l-[var(--color-lime-soft)] p-5">
      <h3 className="display text-base">{t("title")}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      {failed && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/5 px-3.5 py-2.5 text-xs leading-relaxed text-amber-100/90"
        >
          {t(failed)}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={() => void enable()}
          disabled={busy}
          className="btn-primary !px-4 !py-2 text-sm disabled:opacity-60"
        >
          {busy ? t("working") : t("enable")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
        >
          {t("later")}
        </button>
      </div>
    </div>
  );
}
