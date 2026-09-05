"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { readStored, removeStored } from "@/lib/safe-storage";

/**
 * Připomínka rozepsaného cíle na denním přehledu.
 *
 * Zadání cíle se ukládá průběžně, takže odložená aplikace ani zavřený
 * prohlížeč o něj nepřipraví. Uložený koncept, o kterém se člověk nikde
 * nedozví, je ale skoro k ničemu — kdo se vrátí, uvidí dnešek a na
 * rozepsaný cíl si nevzpomene.
 *
 * Proto stojí úplně nahoře, nad vším ostatním. Schválně ne přesměrováním
 * na formulář: to by člověku, který má rozepsaný cíl, zavřelo cestu
 * k dnešním úkolům, a ty potřebuje každý den. Takhle je to první, co
 * uvidí, ale nic mu to nebere.
 *
 * Čte se až po připojení. Koncept je uložený v prohlížeči a server o něm
 * neví, takže při vykreslení na serveru se vykreslit nedá.
 */

/** Musí sedět s klíčem v GoalForm. */
const DRAFT_KEY = "almostthere:goalDraft";

type Draft = {
  title?: string;
  description?: string;
};

export function GoalDraftNotice() {
  const t = useTranslations("plan.goals");
  const locale = useLocale();
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    const raw = readStored(DRAFT_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Draft;
      // Prázdný koncept vzniká i pouhým otevřením formuláře. Připomínat
      // člověku, že „má rozepsaný cíl“, když jen nakoukl a odešel, by
      // bylo otravné.
      if (parsed.title?.trim() || parsed.description?.trim()) {
        setDraft(parsed);
      }
    } catch {
      // Poškozený koncept se tváří, jako by žádný nebyl.
    }
  }, []);

  if (!draft) return null;

  const discard = () => {
    removeStored(DRAFT_KEY);
    setDraft(null);
  };

  return (
    <div className="mt-6 rounded-2xl border border-[color-mix(in_oklab,var(--color-violet-soft)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-violet-glow)_10%,transparent)] p-5">
      <h2 className="display text-lg">{t("draftTitle")}</h2>

      {draft.title?.trim() && (
        <p className="mt-1.5 text-[15px] text-[var(--color-paper)]">
          „{draft.title.trim()}“
        </p>
      )}

      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {t("draftBody")}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Link
          href={`/${locale}/app/goals/new`}
          className="btn-primary inline-block"
        >
          {t("draftContinue")}
        </Link>
        <button
          type="button"
          onClick={discard}
          className="text-sm text-[var(--color-paper-faint)] underline underline-offset-4 hover:text-[var(--color-paper-dim)]"
        >
          {t("draftDiscard")}
        </button>
      </div>
    </div>
  );
}
