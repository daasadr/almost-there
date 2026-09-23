import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { motivationByLocale } from "@/content/motivation";
import { labelIndexForDay, pieceNumberForDay, teaser } from "@/lib/motivation";
import type { Locale } from "@/i18n/routing";

/**
 * Myšlenka na den na přehledu dnešku.
 *
 * Schválně malá a tichá. Na téhle stránce se člověk rozhoduje, co dnes
 * udělá — myšlenka je k tomu doprovod, ne program. Proto jen nadpis
 * a první věta; zbytek se otevře, jen když o něj někdo stojí.
 *
 * Nadpis se obměňuje („myšlenka na den“, „dnešní nakopávač“…), aby to po
 * třech týdnech nebyla tapeta, kterou oko přeskočí.
 *
 * Bez interakce, takže serverová komponenta — text se do prohlížeče
 * nemusí posílat celý.
 */
export async function DailyMotivation({
  locale,
  startedAt,
  today,
}: {
  locale: string;
  /** Kdy uživatel začal. Podle toho se řadí texty, ne podle kalendáře. */
  startedAt: Date;
  today: Date;
}) {
  const pieces = motivationByLocale[locale as Locale] ?? [];
  const number = pieceNumberForDay(startedAt, today, pieces.length);

  // Prázdná knihovna: nic se neukáže. Lepší než prázdný rámeček.
  if (number === 0) return null;

  const piece = pieces[number - 1];
  const t = await getTranslations({ locale, namespace: "motivation" });

  const labels = t.raw("labels") as string[];
  const label = labels[labelIndexForDay(number, labels.length)] ?? labels[0];

  return (
    <Link
      href={`/motivation/${number}`}
      className="card card-hover block p-5"
    >
      <p className="text-xs uppercase tracking-wider text-[var(--color-paper-faint)]">
        {label}
      </p>

      <h3 className="display mt-2 text-base">{piece.title}</h3>

      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {teaser(piece.paragraphs)}
      </p>

      <p className="mt-3 text-sm font-medium text-[var(--color-lime-soft)]">
        {t("cardMore")}
      </p>
    </Link>
  );
}
