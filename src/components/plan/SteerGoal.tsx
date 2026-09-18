"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { GenerationProgress } from "@/components/demo/GenerationProgress";
import { planErrorKey } from "@/lib/plan/errors";

/**
 * Úprava směru už běžícího cíle.
 *
 * Dosud se dal plán přepracovat jedině tehdy, když člověk zaostával —
 * aplikace se ozvala sama a nabídla dohnat skluz nebo posunout termín.
 * Když ale plán seděl k cíli a nesedl k člověku, zbývalo jediné: cíl
 * smazat a založit znovu. Tedy přijít o celou historii plnění kvůli
 * tomu, že se mu nelíbí, jak se k cíli jde.
 *
 * Tohle je ta chybějící cesta. Není to stížnost, je to přání — proto
 * „upravit směr“ a ne „něco mi nesedí“. Cíl ani termín se nemění, mění
 * se cesta k němu; co je pro dosažení opravdu potřeba, v plánu zůstane.
 *
 * Schválně bez konverzace. Poradit se dá s kterýmkoliv chatem, na to
 * vlastní kouč potřeba není — tady jde o jednu větu, která se promítne
 * do plánu.
 */
export function SteerGoal({ goalId }: { goalId: string }) {
  const t = useTranslations("plan.steer");
  const tError = useTranslations("plan.errors");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;

    // Stejná dolní mez jako na serveru. Z holého „nelíbí se mi to“
    // nový plán nevznikne a je lepší to říct hned než za minutu čekání.
    if (text.trim().length < 10) {
      setError("steerTooShort");
      return;
    }

    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/goals/${goalId}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "adjust", steer: text.trim() }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(planErrorKey(data.error));
        setPending(false);
        return;
      }

      setOpen(false);
      setText("");
      setPending(false);
      router.refresh();
    } catch {
      setError("generic");
      setPending(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-edge-strong px-5 py-2 text-sm font-medium text-[var(--color-paper-dim)] transition hover:border-edge-hover hover:text-[var(--color-paper)]"
      >
        {t("button")}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-edge p-5 sm:p-6">
      <h3 className="display text-lg">{t("title")}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          if (error) setError(null);
        }}
        rows={4}
        maxLength={1000}
        disabled={pending}
        placeholder={t("placeholder")}
        className="mt-5 w-full rounded-xl border border-edge bg-surface px-4 py-3 text-[15px] leading-relaxed text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)] focus:border-edge-hover disabled:opacity-60"
      />

      <p className="mt-2 text-xs text-[var(--color-paper-faint)]">{t("hint")}</p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {error === "steerTooShort" ? t("tooShort") : tError(error)}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? t("working") : t("submit")}
        </button>

        {!pending && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            className="text-sm text-[var(--color-paper-faint)] transition-colors hover:text-[var(--color-paper-dim)]"
          >
            {t("cancel")}
          </button>
        )}
      </div>

      {/* Přepracování trvá desítky sekund a bez ukazatele vypadá stránka
          zamrzle — stejný případ jako u prvního rozfázování. */}
      {pending && <GenerationProgress namespace="plan.form.progress" />}
    </form>
  );
}
