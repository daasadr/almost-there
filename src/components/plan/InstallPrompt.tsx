"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Nabídka nainstalovat appku na plochu.
 *
 * Většina lidí netuší, že web jde nainstalovat, a prohlížeč to sám nabídne
 * málokdy a nenápadně. U aplikace, která se má otevírat každé ráno, je
 * ikona na ploše rozdíl mezi zvykem a zapomenutou záložkou.
 *
 * Ukazuje se až v aplikaci za přihlášením, ne na úvodní stránce: kdo se
 * jen rozhlíží, nemá důvod si cokoliv instalovat, a nabídka by v tu chvíli
 * byla otravná.
 */

/** Prohlížeč nabídku nepřipomíná — po odmítnutí mlčíme měsíc. */
const DISMISS_KEY = "almostthere:installDismissed";
const SILENCE_DAYS = 30;

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const t = useTranslations("plan.install");
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < SILENCE_DAYS * 86_400_000) return;

    const onPrompt = (browserEvent: Event) => {
      // Bez tohohle by prohlížeč ukázal vlastní lištu a naše nabídka by
      // byla druhá v pořadí — dvě výzvy na totéž vypadají jako chyba.
      browserEvent.preventDefault();
      setEvent(browserEvent as InstallEvent);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event) return null;

  const install = async () => {
    await event.prompt();
    await event.userChoice;
    // Ať dopadne jakkoliv, tenhle příslib se použít podruhé nedá.
    setEvent(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setEvent(null);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-sm font-semibold text-[var(--color-paper)]">
        {t("title")}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={install}
          className="rounded-full border border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] px-4 py-1.5 text-sm font-medium text-[var(--color-lime-soft)] transition hover:bg-[color-mix(in_oklab,var(--color-lime-glow)_8%,transparent)]"
        >
          {t("install")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
        >
          {t("later")}
        </button>
      </div>
    </section>
  );
}
