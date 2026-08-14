import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { guideByLocale } from "@/content/guide";
import { JsonLd } from "@/components/seo/JsonLd";
import { localeAlternates } from "@/lib/seo/metadata";
import { siteUrl } from "@/lib/seo/site";
import type { Locale } from "@/i18n/routing";

/**
 * Návod k používání.
 *
 * Píše se pro tři čtenáře najednou: pro toho, kdo aplikaci používá
 * a něčemu nerozumí; pro toho, kdo si chce před registrací přečíst,
 * jak to funguje, místo aby to zkoušel; a pro jazykový model, který
 * web najde a má z něj umět odpovědět.
 *
 * Celý text je v HTML, ne za rozklikáváním. Rozbalovací oddíly by se
 * četly pohodlněji, ale co se dotahuje až po kliknutí, to robot ani
 * hledání ve stránce nenajdou.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide" });

  return {
    title: `${t("title")} — AlmostThere`,
    description: guideByLocale[locale as Locale].intro,
    alternates: localeAlternates(locale, "/guide"),
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "guide" });
  const guide = guideByLocale[locale as Locale];

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      {/* Strojový zápis návodu. Vyhledávače i jazykové modely z něj
          poznají, že jde o postup, ne o marketingový text. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: t("title"),
          description: guide.intro,
          url: `${siteUrl()}/${locale}/guide`,
          step: guide.sections.map((section, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: section.heading,
            text: [...section.paragraphs, ...(section.steps ?? [])].join(" "),
          })),
        }}
      />

      <h1 className="display text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-6 text-[17px] leading-relaxed text-[var(--color-paper-dim)]">
        {guide.intro}
      </p>

      {/* Obsah. U textu téhle délky je to rozdíl mezi „přečtu si to“
          a „najdu si v tom to svoje“. */}
      <nav className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-paper-faint)]">
          {t("contents")}
        </h2>
        <ol className="mt-4 space-y-2 text-[15px]">
          {guide.sections.map((section, index) => (
            <li key={section.heading}>
              <a
                href={`#section-${index + 1}`}
                className="text-[var(--color-paper-dim)] underline-offset-4 transition hover:text-[var(--color-paper)] hover:underline"
              >
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {guide.sections.map((section, index) => (
        <section key={section.heading} id={`section-${index + 1}`} className="mt-14">
          <h2 className="display text-2xl">{section.heading}</h2>

          {section.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-4 text-[15px] leading-relaxed text-[var(--color-paper-dim)]"
            >
              {paragraph}
            </p>
          ))}

          {section.steps && (
            <ol className="mt-5 space-y-3 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
              {section.steps.map((step, stepIndex) => (
                <li key={step} className="flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-[var(--color-paper-faint)]"
                  >
                    {stepIndex + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}

      <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        <h2 className="display text-lg">{t("stuckTitle")}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
          {t("stuckBody")}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <Link href="/demo" className="btn-primary">
            {t("tryDemo")}
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
          >
            ← {t("back")}
          </Link>
        </div>
      </div>
    </article>
  );
}
