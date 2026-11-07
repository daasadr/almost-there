import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pdfPlanTemplates } from "@/content/pdf-plans";
import { formatPrice, priceBands } from "@/lib/pdf-plans/pricing";
import { localeAlternates, pageSocial } from "@/lib/seo/metadata";
import { locales, type Locale } from "@/i18n/routing";

/**
 * Rozcestník jednorázových plánů v PDF.
 *
 * Veřejná stránka, protože se platí předem a člověk se podle ní
 * rozhoduje. Před platbou neuvidí nic jiného než tohle a ukázkový
 * soubor, takže tady musí být všechno podstatné: co to je, co to
 * stojí, a čím se to liší od předplatného.
 *
 * Ten poslední bod je tu schválně a nahlas. Kdyby se zamlčel, část
 * lidí by si koupila PDF místo předplatného a byla zklamaná, že se
 * nic neodškrtává — a to je horší než neprodat nic.
 */

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pdfPlans" });

  return {
    title: `${t("metaTitle")} — AlmostThere`,
    description: t("subtitle"),
    ...localeAlternates(locale, "/pdf-plans"),
    ...pageSocial({
      locale,
      path: "/pdf-plans",
      title: t("metaTitle"),
      description: t("subtitle"),
      image: `/og-${locale}.png`,
    }),
  };
}

export default async function PdfPlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "pdfPlans" });
  const bands = priceBands(locale as Locale);

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="display text-4xl leading-tight sm:text-5xl">{t("title")}</h1>
      <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-[var(--color-paper-dim)]">
        {t("subtitle")}
      </p>
      <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-[var(--color-paper)]">
        {t("intro")}
      </p>

      <p className="mt-7">
        <a
          href={`/samples/plan-${locale}.pdf`}
          className="text-sm font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
        >
          {t("sampleCta")} →
        </a>
      </p>

      <h2 className="display mt-16 text-2xl">{t("chooseTitle")}</h2>
      <div className="mt-6 space-y-4">
        {pdfPlanTemplates.map((template) => {
          const text = template.text[locale as Locale];
          return (
            <Link
              key={template.id}
              href={`/${locale}/pdf-plans/${template.id}`}
              className="card card-hover block p-5 sm:p-6"
            >
              <span className="display block text-lg">{text.title}</span>
              <span className="mt-1.5 block text-base leading-relaxed text-[var(--color-paper-dim)]">
                {text.pitch}
              </span>
              <span className="mt-2 block text-sm text-[var(--color-paper-faint)]">
                {text.forWhom}
              </span>
            </Link>
          );
        })}

        {/* Vlastní zadání jako rovnocenná volba, ne jako odkaz dole
            drobným písmem. Většina cílů do žádné šablony nepatří. */}
        <Link
          href={`/${locale}/pdf-plans/custom`}
          className="card card-hover block border-dashed p-5 sm:p-6"
        >
          <span className="display block text-lg">{t("customTitle")}</span>
          <span className="mt-1.5 block text-base leading-relaxed text-[var(--color-paper-dim)]">
            {t("customBody")}
          </span>
          <span className="mt-3 block text-sm font-medium text-[var(--color-lime-soft)]">
            {t("customCta")} →
          </span>
        </Link>
      </div>

      <h2 className="display mt-16 text-2xl">{t("priceTitle")}</h2>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-[var(--color-paper-dim)]">
        {t("priceBody")}
      </p>

      <dl className="mt-6 divide-y divide-[var(--color-edge)] border-y border-edge">
        {bands.map((band) => (
          <div
            key={band.toWeeks}
            className="flex items-baseline justify-between gap-4 py-3"
          >
            <dt className="text-base text-[var(--color-paper-dim)]">
              {t("priceRow", { from: band.fromWeeks, to: band.toWeeks })}
            </dt>
            <dd className="text-base font-medium text-[var(--color-paper)]">
              {formatPrice(band.price, locale as Locale)}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-[var(--color-paper-faint)]">
        {t("priceNote")}
      </p>

      <div className="mt-16 rounded-2xl border border-edge p-6">
        <h2 className="display text-xl">{t("differenceTitle")}</h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("differencePdf")}
        </p>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("differenceApp")}
        </p>
      </div>
    </article>
  );
}
