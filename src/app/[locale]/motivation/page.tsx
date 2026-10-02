import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { QrShare } from "@/components/QrShare";
import { motivationByLocale } from "@/content/motivation";
import { teaser } from "@/lib/motivation";
import { localeAlternates } from "@/lib/seo/metadata";
import { siteUrl } from "@/lib/seo/site";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Všechny myšlenky na den.
 *
 * Na Extra se jich vejde pár, aby stránka zůstala přehledná. Tady jsou
 * všechny — a časem jich budou stovky, takže se tahle stránka počítá
 * s dlouhým seznamem.
 *
 * Má to ještě dva vedlejší užitky. Je to **stálá adresa**, kterou jde
 * dát ven: číslo konkrétní myšlenky se mění podle toho, kolikátý den
 * kdo aplikaci má, ale `/motivation` platí vždycky. A je to stránka,
 * kterou najdou vyhledávače — texty jsou veřejné a je to zatím
 * nejsdílenější obsah, jaký aplikace má.
 *
 * ── Pořadí ──────────────────────────────────────────────────────────
 *
 * Od nejnovějších. Čísla jsou pořadí čtení, ne datum, ale vyšší číslo
 * znamená „přidáno později" — a kdo sem přijde se rozhlédnout, chce
 * vidět to poslední, ne to, co tu bylo od začátku.
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
  const t = await getTranslations({ locale, namespace: "motivation" });

  return {
    title: `${t("allTitle")} — AlmostThere`,
    description: t("allIntro"),
    alternates: localeAlternates(locale, "/motivation"),
  };
}

export default async function MotivationIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "motivation" });
  const pieces = motivationByLocale[locale as Locale] ?? [];

  // Od nejnovějších. Číslo zůstává to původní, protože je to adresa.
  const listed = pieces
    .map((piece, index) => ({ piece, number: index + 1 }))
    .reverse();

  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="display mt-6 text-3xl sm:text-4xl">{t("allTitle")}</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-paper-dim)]">
        {t("allIntro")}
      </p>

      <div className="mt-6">
        <QrShare
          url={`${siteUrl()}/${locale}/motivation`}
          label={t("shareQr")}
          hint={`almost-there.eu/${locale}/motivation`}
        />
      </div>

      <ul className="mt-10 space-y-3">
        {listed.map(({ piece, number }) => (
          <li key={number}>
            <Link
              href={`/motivation/${number}`}
              className="card card-hover block p-5"
            >
              <h2 className="display text-base">{piece.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
                {teaser(piece.paragraphs)}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-12 border-t border-edge pt-6 text-sm text-[var(--color-paper-dim)]">
        {t("about")}{" "}
        <Link href="/" className="underline underline-offset-2">
          {t("aboutLink")}
        </Link>
      </p>
    </section>
  );
}
