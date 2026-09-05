"use client";

import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";
import { clearGoalDraft } from "@/lib/goal-draft";

export function SignOutButton({ label }: { label: string }) {
  const locale = useLocale();

  /**
   * Při odhlášení se uklidí i rozepsaný cíl.
   *
   * Ke konceptu je sice připsané, komu patří, takže se cizímu neukáže —
   * ale nechávat text odhlášeného člověka ležet v prohlížeči, když sám
   * řekl „končím“, je zbytečné. Kdo se odhlásí, čeká, že po sobě nic
   * nezůstane.
   */
  const leave = () => {
    clearGoalDraft();
    void signOut({ callbackUrl: `/${locale}` });
  };

  return (
    <button
      type="button"
      onClick={leave}
      className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-[var(--color-paper-dim)] transition hover:border-white/30 hover:text-[var(--color-paper)]"
    >
      {label}
    </button>
  );
}
