import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { JsonLd } from "@/components/seo/JsonLd";
import { articles, findArticle, readingMinutes } from "@/content/articles";
import { articleLd, graph } from "@/lib/seo/jsonLd";
import { absoluteUrl } from "@/lib/seo/site";
import type { Locale } from "@/i18n/routing";

/**
 * Jeden článek.
 *
 * Článek existuje vždy jen v jazyce, ve kterém byl napsaný. Proto tu
 * nejsou odkazy na jazykové varianty jako u zbytku webu — slibovat
 * vyhledávači překlad, který neexistuje, je horší než nic neslíbit.
 */

export function generateStaticParams() {
  return articles.map((article) => ({
    locale: article.locale,
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = findArticle(locale as Locale, slug);
  if (!article) return {};

  return {
    title: `${article.title} — AlmostThere`,
    description: article.excerpt,
    alternates: { canonical: absoluteUrl(locale, `/blog/${slug}`) },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = findArticle(locale as Locale, slug);
  if (!article) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });

  const formatDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <JsonLd data={graph(articleLd(locale as Locale, article))} />

      <Link
        href={`/${locale}/blog`}
        className="text-sm text-[var(--color-paper-faint)] transition-colors hover:text-[var(--color-paper-dim)]"
      >
        ← {t("backToList")}
      </Link>

      <header className="mx-auto mt-10 max-w-[68ch]">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-wider text-[var(--color-paper-faint)]">
          <time dateTime={article.publishedAt}>
            {formatDate.format(new Date(`${article.publishedAt}T12:00:00Z`))}
          </time>
          <span aria-hidden="true">·</span>
          <span>{t("readingTime", { minutes: readingMinutes(article) })}</span>
        </p>

        {/* Titulek smí být dlouhý — proto `text-balance`, aby se řádky
            rozdělily rovnoměrně a poslední nezůstal na jedno slovo. */}
        <h1 className="display mt-4 text-balance text-4xl leading-[1.08] sm:text-5xl">
          {article.title}
        </h1>
      </header>

      <div className="hairline mx-auto mt-10 max-w-[68ch]" />

      <div className="mt-10">
        <ArticleBody blocks={article.blocks} />
      </div>

      {/*
        Pozvánka na konci, ne v textu.

        Kdo dočetl až sem, téma ho zajímá — tohle je jediné místo, kde
        nabídka nepůsobí jako přerušení. V samotném článku nic takového
        být nesmí, tam by z textu udělala reklamu.
      */}
      <aside className="mx-auto mt-20 max-w-[68ch] rounded-2xl border border-[color-mix(in_oklab,var(--color-lime-glow)_28%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_6%,transparent)] p-7">
        <h2 className="display text-xl">{t("ctaTitle")}</h2>
        <p className="mt-2.5 text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("ctaBody")}
        </p>
        <Link href={`/${locale}/demo`} className="btn-primary mt-6">
          {t("ctaButton")}
        </Link>
      </aside>
    </article>
  );
}
