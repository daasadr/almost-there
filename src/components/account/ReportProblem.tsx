"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MAX_LENGTH, MIN_LENGTH } from "@/lib/feedback/limits";

/**
 * „Něco nefunguje nebo zlobí?"
 *
 * Nenápadné, ale k nalezení. Vypadá jako karta nastavení o kus výš, jen
 * bez barevného proužku — na stránce účtu nemá být nejhlasitější věcí,
 * zároveň ji nemá nikdo hledat.
 *
 * ── Proč rozbalovací, a ne samostatná stránka ───────────────────────
 *
 * Odkaz na formulář jinde by znamenal další klepnutí a další čekání.
 * Kdo je naštvaný, odejde dřív, než se stránka načte. Takhle se pole
 * otevře na místě a dá se psát hned.
 *
 * ── Proč bez výběru kategorie ───────────────────────────────────────
 *
 * Zvažovalo se „chyba / návrh / jiné". Kdo má problém, nemá ho ještě
 * třídit — a špatně zvolená kategorie je horší než žádná, protože se
 * podle ní pak filtruje. Třídí se až ve správě, kde je vidět celý text.
 */

type State = "idle" | "sending" | "sent" | "failed";

export function ReportProblem() {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const fieldId = useId();

  const [text, setText] = useState("");
  const [state, setState] = useState<State>("idle");

  const tooShort = text.trim().length < MIN_LENGTH;

  const send = async () => {
    setState("sending");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), locale }),
      });

      if (!response.ok) {
        setState("failed");
        return;
      }

      setText("");
      setState("sent");
    } catch {
      setState("failed");
    }
  };

  /*
   * Po odeslání zůstává poděkování místo formuláře. Prázdné pole
   * připravené k dalšímu psaní vypadá, jako by se nic neodeslalo —
   * a člověk to pošle podruhé.
   */
  if (state === "sent") {
    return (
      <div className="card mt-6 p-5 sm:p-6">
        <p className="display text-lg">{t("thanksTitle")}</p>
        <p className="mt-1.5 text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("thanksBody")}
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-4 text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
        >
          {t("again")}
        </button>
      </div>
    );
  }

  return (
    <details className="card mt-6 p-5 sm:p-6 [&[open]_.marker]:rotate-90">
      <summary className="flex cursor-pointer list-none items-start gap-4">
        <span
          aria-hidden="true"
          className="marker mt-0.5 text-xl leading-none text-[var(--color-paper-faint)] transition-transform"
        >
          ›
        </span>
        <span className="min-w-0">
          <span className="display block text-lg">{t("title")}</span>
          <span className="mt-1 block text-sm leading-relaxed text-[var(--color-paper-dim)]">
            {t("subtitle")}
          </span>
        </span>
      </summary>

      <div className="mt-5">
        <label htmlFor={fieldId} className="sr-only">
          {t("label")}
        </label>
        <textarea
          id={fieldId}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={MAX_LENGTH}
          rows={5}
          placeholder={t("placeholder")}
          className="w-full rounded-xl border border-edge bg-surface p-3 text-base leading-relaxed text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)]"
        />

        {state === "failed" && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-[var(--color-danger)]"
          >
            {t("failed")}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={send}
            disabled={tooShort || state === "sending"}
            className="btn-primary disabled:opacity-50"
          >
            {state === "sending" ? t("sending") : t("send")}
          </button>

          {/* Co se odesílá navíc. Patří to sem, ne do zásad — kdo zrovna
              píše, má vědět, co odchází s textem. */}
          <span className="text-sm text-[var(--color-paper-faint)]">
            {t("note")}
          </span>
        </div>
      </div>
    </details>
  );
}
