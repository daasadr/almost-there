import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { latestRelease, RELEASES_URL } from "@/lib/visionboard/download";
import { localeAlternates } from "@/lib/seo/metadata";
import { locales } from "@/i18n/routing";

/**
 * Stažení Vision Boardu.
 *
 * Instalátor leží na GitHubu a aplikace se odtamtud sama aktualizuje;
 * tahle stránka je jen cesta k prvnímu stažení pro toho, kdo ji ještě
 * nemá.
 *
 * Generuje se jednou za hodinu, protože tak dlouho se drží odpověď
 * z GitHubu. Veřejné API pustí šedesát dotazů za hodinu z adresy a
 * vydání se nekoná častěji než jednou za pár dní.
 */

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "visionboard.download" });

  return {
    title: `${t("title")} — AlmostThere`,
    description: t("intro"),
    ...localeAlternates(locale, "/visionboard/download"),
  };
}

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "visionboard.download" });
  const release = await latestRelease();

  return (
    <section className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-lime-soft)]">
        Vision Board
      </p>
      <h1 className="display mt-4 text-4xl leading-tight">{t("title")}</h1>
      <p className="mt-5 text-lg leading-relaxed text-[var(--color-paper-dim)]">
        {t("intro")}
      </p>

      {release ? (
        <>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            {release.downloads.map((download) => (
              <a
                key={download.url}
                href={download.url}
                className="btn-primary !px-6 !py-3"
              >
                {t(`get.${download.platform}`)}
              </a>
            ))}
          </div>

          <p className="mt-4 text-sm text-[var(--color-paper-faint)]">
            {t("version", {
              version: release.version,
              size: release.downloads[0]?.sizeMb ?? 0,
            })}
          </p>
        </>
      ) : (
        /* GitHub neodpověděl. Stálý odkaz vede na stránku vydání, kde
           si člověk soubor najde sám — o klik navíc, ale vždycky
           funguje. Chybová stránka by tu byla k ničemu. */
        <a href={RELEASES_URL} className="btn-primary mt-9 inline-flex !px-6 !py-3">
          {t("fallback")}
        </a>
      )}

      <div className="mt-12 rounded-2xl border border-edge p-5 sm:p-6">
        <h2 className="display text-base">{t("afterTitle")}</h2>
        <ol className="mt-3 space-y-2 text-base leading-relaxed text-[var(--color-paper-dim)]">
          <li>1. {t("step1")}</li>
          <li>2. {t("step2")}</li>
          <li>3. {t("step3")}</li>
        </ol>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-[var(--color-paper-faint)]">
        {t("updates")}{" "}
        <a
          href={RELEASES_URL}
          className="underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
        >
          {t("changelog")}
        </a>
      </p>

      <p className="mt-6 text-sm">
        <Link
          href={`/${locale}/extras`}
          className="text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
        >
          {t("backToExtras")}
        </Link>
      </p>
    </section>
  );
}
