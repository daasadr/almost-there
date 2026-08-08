import { getTranslations } from "next-intl/server";
import { getBudget } from "@/lib/ai/usage";

/**
 * Upozornění na měsíční strop spotřeby AI.
 *
 * Ukazuje se až od hranice varování — do té doby by to byl jen šum. Když
 * někdo na strop narazí, musí vědět dvě věci: že o hotové plány nepřijde
 * a kdy se limit obnoví. Bez toho to vypadá, že se aplikace rozbila.
 *
 * Záměrně nezobrazujeme koruny. Zákazník koupil paušál, ne kredit; kolik
 * nás jeho plán stál, není jeho starost.
 */
export async function BudgetNotice({
  userId,
  locale,
}: {
  userId: string;
  locale: string;
}) {
  const budget = await getBudget(userId);
  if (!budget.warning) return null;

  const t = await getTranslations({ locale, namespace: "plan.budget" });
  const percent = Math.min(
    100,
    Math.round((budget.spentHellers / budget.capHellers) * 100),
  );

  const exhausted = budget.exhausted;

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
