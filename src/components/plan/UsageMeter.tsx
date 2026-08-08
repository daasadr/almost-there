import { getTranslations } from "next-intl/server";
import { getPlanAllowance } from "@/lib/ai/usage";

/**
 * Kolik z měsíčního limitu nových plánů je spotřebováno.
 *
 * Ukazuje se v procentech, ne v korunách. Zákazník koupil paušál, ne kredit;
 * kdyby viděl útratu, začal by počítat každé kliknutí. Procento navíc drží
 * smysl i tehdy, když se limit časem změní.
 */
export async function UsageMeter({
  userId,
  locale,
}: {
  userId: string;
  locale: string;
}) {
  const allowance = await getPlanAllowance(userId);
  const t = await getTranslations({ locale, namespace: "plan.budget" });

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[var(--color-paper-faint)]">{t("meter")}</span>
        <span className="tabular-nums text-[var(--color-paper)]">
          {t("meterValue", {
            percent: allowance.percent,
            remaining: allowance.remaining,
          })}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${
            allowance.exhausted
              ? "bg-red-400/70"
              : "bg-gradient-to-r from-[var(--color-emerald-soft)] to-[var(--color-lime-soft)]"
          }`}
          style={{ width: `${Math.max(2, allowance.percent)}%` }}
        />
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[var(--color-paper-faint)]">
        {t("meterNote")}
      </p>
    </div>
  );
}
