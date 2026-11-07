"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

/**
 * Nabídka převést koupený plán na živý cíl.
 *
 * Ukazuje se jen předplatitelům — jinde by to byla nabídka něčeho,
 * co si člověk nemůže vzít, a to je horší než ticho.
 *
 * Model se při převodu nevolá: plán už existuje a použije se tak, jak
 * je. Vytištěný papír se proto s obrazovkou nemůže rozejít, a to je
 * celý smysl téhle cesty.
 */
export function ConvertToGoal({
  planId,
  goalId,
}: {
  planId: string;
  /** Id cíle, když už z plánu jednou vznikl. */
  goalId: string | null;
}) {
  const t = useTranslations("pdfPlans");
  const locale = useLocale();
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (goalId) {
    return (
      <p className="mt-4 text-sm">
        <a
          href={`/${locale}/app/goals/${goalId}`}
          className="text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
        >
          {t("convertDone")} →
        </a>
      </p>
    );
  }

  const convert = async () => {
    setBusy(true);
    setFailed(false);

    try {
      const response = await fetch(`/api/pdf-plans/${planId}/convert`, {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (data?.ok && data.goalId) {
        router.push(`/${locale}/app/goals/${data.goalId}`);
        return;
      }

      // Už převedeno jinou záložkou — cíl existuje, jen ho tahle
      // stránka ještě nevidí. Překreslení ze serveru to srovná.
      if (data?.error === "alreadyConverted") {
        router.refresh();
        return;
      }

      setFailed(true);
      setBusy(false);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-edge p-5 sm:p-6">
      <h2 className="display text-base">{t("convertTitle")}</h2>
      <p className="mt-2 text-base leading-relaxed text-[var(--color-paper-dim)]">
        {t("convertBody")}
      </p>

      {failed && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-[var(--color-danger)]"
        >
          {t("errors.generic")}
        </p>
      )}

      <button
        type="button"
        onClick={convert}
        disabled={busy}
        className="btn-primary mt-4 disabled:opacity-50"
      >
        {busy ? t("converting") : t("convertCta")}
      </button>
    </div>
  );
}
