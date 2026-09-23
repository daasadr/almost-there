"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { splitSentences } from "@/lib/motivation";
import { isStoreAppClient } from "@/lib/store-app";

/**
 * Předčítání myšlenky na den.
 *
 * Čte prohlížeč, ne nahrávka. Původně to mělo být namluvené audio, ale
 * pět minut denně ve třech jazycích se natáčet nedá a generované hlasy
 * zněly špatně. Od strojového předčítání naproti tomu nikdo herecký výkon
 * nečeká — a to je jeho výhoda, ne nedostatek.
 *
 * Text se čte po větách, ne najednou. Tři důvody:
 *
 *  1. Předčítání v prohlížeči neumí skočit doprostřed. Po větách se dá
 *     kliknutím začít od kterékoliv.
 *  2. Právě čtená věta se dá zvýraznit — oko pak ví, kde je.
 *  3. Chrome utne delší promluvu zhruba po patnácti vteřinách. Věta se
 *     pod ten limit vejde vždycky.
 *
 * „Pauza" je ve skutečnosti zastavení se zapamatovaným místem, ne
 * `pause()`. Pozastavení předčítání je na Androidu vyhlášeně nespolehlivé
 * a uživatel nepozná rozdíl — jen se mu rozečtená věta začne od začátku.
 */

export function MotivationReader({
  paragraphs,
  lang,
  /** Adresa téhle stránky. Pro otevření v prohlížeči z aplikace. */
  shareUrl,
}: {
  paragraphs: string[];
  lang: string;
  shareUrl: string;
}) {
  const t = useTranslations("motivation");

  /** Věty napříč odstavci — pořadí čtení. Odstavce zůstávají pro oči. */
  const structure = useMemo(() => {
    const byParagraph = paragraphs.map((text) => splitSentences(text));
    const flat: string[] = [];
    const indexOf: number[][] = [];

    for (const sentences of byParagraph) {
      const row: number[] = [];
      for (const sentence of sentences) {
        row.push(flat.length);
        flat.push(sentence);
      }
      indexOf.push(row);
    }

    return { byParagraph, flat, indexOf };
  }, [paragraphs]);

  const total = structure.flat.length;

  // `null` = ještě nevíme; v tu chvíli se nevykreslí ani tlačítko, ani
  // poznámka, aby se nic neprobliklo a hned nezmizelo.
  const [supported, setSupported] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Stav, ne ref: podle tohohle se rozhoduje, co se vykreslí.
  const [storeApp, setStoreApp] = useState(false);

  /**
   * Co umí tenhle prohlížeč, se na serveru zjistit nedá — proto až
   * v efektu po připojení. ESLint tu varuje před zápisem stavu v efektu
   * a obecně má pravdu; tohle je ta výjimka, kdy jiná cesta není.
   */
  useEffect(() => {
    setStoreApp(isStoreAppClient());

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);

    /**
     * Hlasy se načítají až po chvíli a napoprvé bývá seznam prázdný.
     * Bez `voiceschanged` by se vzal výchozí hlas systému, což u českého
     * textu znamená anglickou výslovnost.
     */
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const base = lang.split("-")[0];
      const match =
        voices.find((v) => v.lang.toLowerCase().startsWith(`${base}-`)) ??
        voices.find((v) => v.lang.toLowerCase().startsWith(base)) ??
        null;
      if (match) setVoice(match);
    };

    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pick);
      // Předčítání je vlastnost okna, ne komponenty. Bez tohohle mluví
      // dál i po přechodu na jinou stránku.
      window.speechSynthesis.cancel();
    };
  }, [lang]);

  /** Vyslovení právě jedné věty. Konec věty posune na další. */
  useEffect(() => {
    if (!playing || supported !== true) return;

    const sentence = structure.flat[index];
    if (sentence === undefined) {
      // Doposlouchané. Zápis stavu v efektu je tu schválně: konec textu
      // se pozná až podle indexu, který sem doputoval z `onend`.
      setPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = lang;
    if (voice) utterance.voice = voice;
    // Výchozí tempo je na souvislý text o něco rychlé.
    utterance.rate = 0.95;

    utterance.onend = () => setIndex((current) => current + 1);
    utterance.onerror = () => setPlaying(false);

    window.speechSynthesis.speak(utterance);

    return () => window.speechSynthesis.cancel();
  }, [playing, index, voice, lang, supported, structure.flat]);

  const toggle = useCallback(() => {
    setPlaying((current) => {
      // Doposlouchané se pustí znovu od začátku, ne do ztracena.
      if (!current && index >= total) setIndex(0);
      return !current;
    });
  }, [index, total]);

  const startFrom = useCallback((at: number) => {
    setIndex(at);
    setPlaying(true);
  }, []);

  const openOutside = useCallback(async () => {
    try {
      const { Browser } = await import("@capacitor/browser");
      // Otevře se v Chromu, ne ve vestavěném zobrazení aplikace —
      // a ten předčítat umí.
      await Browser.open({ url: shareUrl });
    } catch {
      window.open(shareUrl, "_blank", "noopener");
    }
  }, [shareUrl]);

  const done = Math.min(index, total);

  return (
    <div>
      {supported === true && total > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            className="btn-primary !px-5 !py-2 text-sm"
            aria-describedby="motivation-progress"
          >
            {playing ? t("pause") : index > 0 && index < total ? t("resume") : t("play")}
          </button>

          <div className="min-w-32 flex-1">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-surface-strong"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={t("progressLabel")}
            >
              <div
                className="h-full rounded-full bg-[var(--color-lime-soft)] transition-[width] duration-300"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </div>
            <p
              id="motivation-progress"
              className="mt-1.5 text-xs text-[var(--color-paper-faint)]"
            >
              {t("progress", { done, total })}
            </p>
          </div>
        </div>
      )}

      {/*
        Bez předčítání zůstane text — jen se řekne, kde si ho pustit.
        Týká se hlavně aplikace z obchodu: Android WebView, na kterém
        stojí, předčítat neumí. Tam vede tlačítko do Chromu, kde to jde.
      */}
      {supported === false && (
        <p className="text-sm text-[var(--color-violet-soft)]">
          {t("unsupported")}{" "}
          {storeApp && (
            <button
              type="button"
              onClick={openOutside}
              className="underline underline-offset-2"
            >
              {t("openOutside")}
            </button>
          )}
        </p>
      )}

      <div className="mt-7 space-y-5">
        {structure.byParagraph.map((sentences, p) => (
          <p key={p} className="text-base leading-relaxed">
            {sentences.map((sentence, s) => {
              const at = structure.indexOf[p][s];
              const current = playing && at === index;

              // Kliknutím se začne od téhle věty. Bez předčítání je to
              // obyčejný text, ne mrtvé tlačítko.
              return supported === true ? (
                <button
                  key={s}
                  type="button"
                  onClick={() => startFrom(at)}
                  className={`cursor-pointer text-left transition ${
                    current
                      ? "bg-[color-mix(in_oklab,var(--color-lime-glow)_20%,transparent)] text-[var(--color-paper)]"
                      : "hover:text-[var(--color-paper)]"
                  }`}
                >
                  {sentence}{" "}
                </button>
              ) : (
                <span key={s}>{sentence} </span>
              );
            })}
          </p>
        ))}
      </div>
    </div>
  );
}
