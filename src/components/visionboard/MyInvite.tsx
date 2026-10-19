"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Osobní pozvánka k Vision Boardu.
 *
 * Načítá se z prohlížeče, aby stránka Extra zůstala staticky
 * generovaná — stejný důvod jako u seznamu zařízení.
 *
 * Nepřihlášenému se nevykreslí nic: pozvánku, kterou nemá komu
 * přiřadit, nemá smysl nabízet.
 */

type Invite = { url: string; accepted: number };

export function MyInvite() {
  const t = useTranslations("visionboard.invite");

  const [invite, setInvite] = useState<Invite | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;

    void fetch("/api/visionboard/invite")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (alive && data?.signedIn) {
          setInvite({ url: data.url, accepted: data.accepted ?? 0 });
        }
      })
      .catch(() => {
        // Na veřejné stránce se výpadek nehlásí, oddíl se prostě neukáže.
      });

    return () => {
      alive = false;
    };
  }, []);

  if (!invite) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Schránka bývá zakázaná v nezabezpečeném kontextu i v některých
      // prohlížečích. Odkaz je vypsaný, takže se dá označit rukou.
    }
  };

  /** Sdílení přes systém. V PWA a na mobilu je to ta pohodlnější cesta. */
  const share = async () => {
    try {
      await navigator.share({ url: invite.url, title: t("shareTitle") });
    } catch {
      // Zavřené okno sdílení není chyba.
    }
  };

  return (
    <section className="card mt-6 p-5 sm:p-6">
      <h2 className="display text-lg">{t("title")}</h2>
      <p className="mt-1.5 text-base leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      {/* Odkaz je vidět celý, ne schovaný za tlačítkem. Kdo ho chce
          opsat nebo poslat jinudy, má ho před sebou. */}
      <p className="mt-5 break-all rounded-xl border border-edge bg-scrim px-4 py-3 text-sm text-[var(--color-paper)]">
        {invite.url}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={() => void copy()}
          className="text-sm font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
        >
          {copied ? t("copied") : t("copy")}
        </button>

        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            type="button"
            onClick={() => void share()}
            className="text-sm text-[var(--color-paper-dim)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
          >
            {t("share")}
          </button>
        )}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-[var(--color-paper-faint)]">
        {invite.accepted > 0
          ? t("accepted", { count: invite.accepted })
          : t("none")}
      </p>
    </section>
  );
}
