import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { articlesFor, readingMinutes } from "@/content/articles";
import { localeAlternates } from "@/lib/seo/metadata";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Výpis článků.
 *
 * Schválně ne mřížka karet s náhledovými obrázky. Karty jsou dobré na
 * produkty, kde se vybírá očima; tady se vybírá podle toho, o čem to je,
 * takže rozhoduje titulek a jedna věta pod ním. Řádky pod sebou navíc
 * unesou dlouhý titulek, který by kartu rozhodil.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const hasArticles = articlesFor(locale as Locale).length > 0;

  return {
    title: `${t("title")} — AlmostThere`,
    description: t("subtitle"),
    alternates: localeAlternates(locale, "/blog"),
    // Prázdný výpis do vyhledávání nepatří. Až tu něco bude, půjde
    // stránka ven sama, bez zásahu.
    robots: hasArticles ? undefined : { index: false, follow: true },
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "blog" });
  const items = articlesFor(locale as Locale);

  const formatDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
      <header className="max-w-2xl">
        <h1 className="display text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-[var(--color-paper-dim)]">
          {t("subtitle")}
        </p>
      </header>

      <div className="hairline mt-12" />

      {items.length === 0 ? (
        <p className="mt-12 text-[var(--color-paper-faint)]">{t("empty")}</p>
      ) : (
        <ul>
          {items.map((article) => (
            <li key={article.slug} className="border-b border-edge-faint">
              <Link
                href={`/${locale}/blog/${article.slug}`}
                className="group block py-10 transition-opacity"
              >
                {/* Datum a délka nad titulkem, drobně. Kdo výpis prochází,
                    hledá téma — tohle je až druhá informace. */}
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-wider text-[var(--color-paper-faint)]">
                  <time dateTime={article.publishedAt}>
                    {formatDate.format(new Date(`${article.publishedAt}T12:00:00Z`))}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t("readingTime", { minutes: readingMinutes(article) })}
                  </span>
                </p>

                <h2 className="display mt-3 text-2xl leading-snug transition-colors group-hover:text-[var(--color-lime-soft)] sm:text-3xl">
                  {article.title}
                </h2>

                <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
                  {article.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
