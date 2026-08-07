"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

/**
 * Smazání cíle. Dvoukrokové — s celým plánem je to nevratné a jedno
 * nechtěné kliknutí by zahodilo práci, která stála peníze i čekání.
 */
export function DeleteGoalButton({ goalId }: { goalId: string }) {
  const t = useTranslations("plan.detail");
  const router = useRouter();
  const locale = useLocale();

  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  const remove = async () => {
    setPending(true);
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("delete failed");

      router.push(`/${locale}/app`);
      router.refresh();
    } catch {
      setPending(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-red-300 hover:underline"
      >
        {t("delete")}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-400/25 bg-red-400/5 p-4">
      <p className="text-sm leading-relaxed text-[var(--color-paper)]">
        {t("deleteConfirm")}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-full border border-red-400/40 px-4 py-1.5 text-sm font-medium text-red-200 transition hover:bg-red-400/10 disabled:opacity-60"
        >
          {pending ? t("deleting") : t("deleteYes")}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-[var(--color-paper-dim)] transition hover:border-white/30"
        >
          {t("deleteNo")}
        </button>
      </div>
    </div>
  );
}
