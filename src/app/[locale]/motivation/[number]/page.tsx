import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MotivationReader } from "@/components/motivation/MotivationReader";
import { motivationByLocale } from "@/content/motivation";
import { teaser } from "@/lib/motivation";
import { localeAlternates } from "@/lib/seo/metadata";
import { siteUrl } from "@/lib/seo/site";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Myšlenka na den.
 *
 * Stránka je schválně **veřejná**, bez přihlášení. Tři důvody:
 *
 *  1. Z aplikace z obchodu se odsud otevírá Chrome, aby text šel přečíst
 *     nahlas — a tahat do něj přihlášení by z jednoho klepnutí udělalo
 *     tři kroky.
 *  2. Texty nejsou to, co se platí. Platí se plán. Tohle je pozvánka.
 *  3. Dá se poslat kamarádovi a Google si to může najít.
 *
 * Nic osobního tu není: text je pro všechny stejný, jen ho každý dostane
 * v jiný den podle toho, kolikátý den aplikaci má.
 */

type Params = { locale: string; number: string };

/** Číslo z adresy na index v knihovně, nebo `null`, když nesedí. */
function indexFrom(locale: string, raw: string): number | null {
  const pieces = motivationByLocale[locale as Locale];
  if (!pieces) return null;

  // Jen holé číslo. „01“ ani „1.5“ ne — jinak by týž text měl víc adres
  // a hledání by si je navzájem ředilo.
  if (!/^[1-9]\d*$/.test(raw)) return null;

  const index = Number(raw) - 1;
  return index < pieces.length ? index : null;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    motivationByLocale[locale].map((_, i) => ({
      locale,
      number: String(i + 1),
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, number } = await params;
  const index = indexFrom(locale, number);
  if (index === null) return {};

  const piece = motivationByLocale[locale as Locale][index];

  return {
    title: `${piece.title} — AlmostThere`,
    description: teaser(piece.paragraphs),
    alternates: localeAlternates(locale, `/motivation/${number}`),
  };
}

export default async function MotivationPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, number } = await params;
  setRequestLocale(locale);

  const index = indexFrom(locale, number);
  if (index === null) notFound();

  const piece = motivationByLocale[locale as Locale][index];
  const t = await getTranslations({ locale, namespace: "motivation" });

  return (
    <article className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs uppercase tracking-wider text-[var(--color-paper-faint)]">
        {t("eyebrow")}
      </p>

      <h1 className="display mt-3 text-3xl sm:text-4xl">{piece.title}</h1>

      <div className="mt-8">
        <MotivationReader
          paragraphs={piece.paragraphs}
          lang={locale}
          shareUrl={`${siteUrl()}/${locale}/motivation/${number}`}
        />
      </div>

      {/* Pozvánka, ne výzva. Kdo si sem přišel přečíst text, nepřišel
          si kupovat předplatné — a kdyby na něj narazil hned, přestal
          by ty texty číst. */}
      <p className="mt-12 border-t border-edge pt-6 text-sm text-[var(--color-paper-dim)]">
        {t("about")}{" "}
        <Link href="/" className="underline underline-offset-2">
          {t("aboutLink")}
        </Link>
      </p>
    </article>
  );
}
