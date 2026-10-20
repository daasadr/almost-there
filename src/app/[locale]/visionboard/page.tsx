import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqLd, graph } from "@/lib/seo/jsonLd";
import { localeAlternates, pageSocial } from "@/lib/seo/metadata";
import { locales } from "@/i18n/routing";

/**
 * Veřejná stránka Vision Boardu.
 *
 * Dvojí úkol, stejně jako u šablon: pro člověka vysvětlit, co to je,
 * pro vyhledávač být stránkou o nástěnce snů, ne o plánovači.
 *
 * Zároveň je to cíl osobních pozvánek (`?ref=`). Kód z adresy
 * zachytí middleware, ne tahle stránka — kdyby na parametry sáhla
 * sama, přestala by se předgenerovat.
 */

const FAQ_KEYS = ["platform", "offline", "wallpaper", "speed", "privacy"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "visionboard.landing" });

  return {
    title: `${t("metaTitle")} — AlmostThere`,
    description: t("subtitle"),
    ...localeAlternates(locale, "/visionboard"),
    ...pageSocial({
      locale,
      path: "/visionboard",
      title: t("metaTitle"),
      description: t("subtitle"),
      image: `/og-visionboard-${locale}.png`,
    }),
  };
}

export default async function VisionBoardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "visionboard.landing" });

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <JsonLd
        data={graph(
          faqLd(FAQ_KEYS.map((key) => ({ q: t(`faq.${key}.q`), a: t(`faq.${key}.a`) }))),
        )}
      />

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-lime-soft)]">
        Vision Board
      </p>
      <h1 className="display mt-4 text-4xl leading-tight sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-[var(--color-paper-dim)]">
        {t("subtitle")}
      </p>

      <Image
        src="/visionboard/board.webp"
        alt={t("boardAlt")}
        width={1600}
        height={1024}
        priority
        className="mt-10 rounded-2xl border border-edge"
      />

      <p className="mt-10 text-lg leading-relaxed text-[var(--color-paper)]">
        {t("intro")}
      </p>

      <h2 className="display mt-16 text-2xl">{t("featuresTitle")}</h2>

      <div className="mt-8 space-y-10">
        <Feature title={t("wallpaperTitle")} body={t("wallpaperBody")} />

        <Feature title={t("reminderTitle")} body={t("reminderBody")}>
          <Image
            src="/visionboard/reminder.webp"
            alt={t("reminderAlt")}
            width={709}
            height={328}
            className="mt-4 rounded-xl border border-edge"
          />
        </Feature>

        <Feature title={t("hotspotTitle")} body={t("hotspotBody")}>
          <Image
            src="/visionboard/hotspot.webp"
            alt={t("hotspotAlt")}
            width={469}
            height={412}
            className="mt-4 rounded-xl border border-edge"
          />
        </Feature>

        <Feature title={t("stepsTitle")} body={t("stepsBody")}>
          <Image
            src="/visionboard/steps.webp"
            alt={t("stepsAlt")}
            width={500}
            height={450}
            className="mt-4 rounded-xl border border-edge"
          />
        </Feature>
        <Feature title={t("looksTitle")} body={t("looksBody")} />
        <Feature title={t("privateTitle")} body={t("privateBody")} />
      </div>

      <div className="mt-16 rounded-2xl border border-edge p-6">
        <h2 className="display text-xl">{t("whyTitle")}</h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("whyBody")}
        </p>
      </div>

      <div className="mt-16 border-t border-edge pt-10">
        <h2 className="display text-2xl">{t("getTitle")}</h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("getBody")}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href={`/${locale}/register`} className="btn-primary !px-6 !py-3">
            {t("getCta")}
          </Link>
          <Link
            href={`/${locale}/visionboard/download`}
            className="text-sm text-[var(--color-paper-dim)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
          >
            {t("haveAccount")}
          </Link>
        </div>
      </div>

      <h2 className="display mt-16 text-2xl">{t("faqTitle")}</h2>
      <dl className="mt-6 space-y-6">
        {FAQ_KEYS.map((key) => (
          <div key={key}>
            <dt className="text-base font-medium text-[var(--color-paper)]">
              {t(`faq.${key}.q`)}
            </dt>
            <dd className="mt-1.5 text-base leading-relaxed text-[var(--color-paper-dim)]">
              {t(`faq.${key}.a`)}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function Feature({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="display text-lg">{title}</h3>
      <p className="mt-2 text-base leading-relaxed text-[var(--color-paper-dim)]">
        {body}
      </p>
      {children}
    </section>
  );
}
