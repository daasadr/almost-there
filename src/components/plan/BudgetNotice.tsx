import { getTranslations } from "next-intl/server";
import { getBudget, getPlanAllowance } from "@/lib/ai/usage";

/**
 * Upozornění, že se blíží konec měsíčního limitu.
 *
 * Ukazuje se až od 70 % — do té doby by to byl jen šum. Kdo na limit
 * narazí, musí se dozvědět dvě věci: že o hotové plány nepřijde a kdy se
 * limit obnoví. Bez toho to vypadá, že se aplikace rozbila.
 *
 * Hlídají se dva limity. Zákazník zná ten na počet nových plánů; strop
 * v korunách je tichá pojistka proti zneužití a poctivé použití na něj
 * nedosáhne. Hlásíme oba stejně — pro uživatele je to jedna a tatáž věc.
 */
export async function BudgetNotice({
  userId,
  locale,
}: {
  userId: string;
  locale: string;
}) {
  const [allowance, budget] = await Promise.all([
    getPlanAllowance(userId),
    getBudget(userId),
  ]);

  const exhausted = allowance.exhausted || budget.exhausted;
  const percent = Math.max(allowance.percent, budget.percent);
  if (!exhausted && percent < 70) return null;

  const t = await getTranslations({ locale, namespace: "plan.budget" });

  return (
    <div
      className={`rounded-2xl border p-5 ${
        exhausted
          ? "border-red-400/25 bg-red-400/5"
          : "border-amber-400/25 bg-amber-400/5"
      }`}
    >
      <h2
        className={`text-sm font-semibold ${
          exhausted ? "text-red-200" : "text-amber-200"
        }`}
      >
        {exhausted ? t("exhaustedTitle") : t("warningTitle")}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {exhausted ? t("exhaustedBody") : t("warningBody", { percent })}
      </p>
    </div>
  );
}
