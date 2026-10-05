import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { templateAreas, templates } from "@/content/templates";
import { localeAlternates } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";

/**
 * Rozcestník šablon — veřejně, bez přihlášení.
 *
 * Šablona není funkce aplikace, je to důvod, proč sem někdo přijde.
 * Kdo hledá „jak se naučit kreslit", nehledá plánovač; hledá tu věc.
 * Proto jsou tyhle stránky veřejné, indexovatelné a dají se poslat
 * samostatně — každá odpovídá na jednu otázku, kterou si lidé kladou.
 *
 * Uvnitř aplikace vede k témuž rozcestníku tlačítko u nového cíle.
 * Dvě verze téhož seznamu by se rozešly, a hlavně: přihlášený člověk
 * tu nepotřebuje nic jiného než nepřihlášený.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "templates" });

  return {
    title: `${t("metaTitle")} — AlmostThere`,
    description: t("metaDescription"),
    ...localeAlternates(locale, "/templates"),
  };
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "templates" });

  return (
    <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="display text-4xl leading-tight sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-[var(--color-paper-dim)]">
        {t("intro")}
      </p>

      {templateAreas.map((area) => (
        <div key={area} className="mt-14">
          <h2 className="display text-xl">{t(`areas.${area}`)}</h2>

          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {templates
              .filter((template) => template.area === area)
              .map((template) => {
                const text = template.text[locale as Locale];

                return (
                  <li key={template.id}>
                    <Link
                      href={`/${locale}/templates/${template.id}`}
                      className="card card-hover block h-full p-5"
                    >
                      <h3 className="display text-base leading-snug">
                        {text.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-paper-dim)]">
                        {text.pitch}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-wider text-[var(--color-paper-faint)]">
                        {t("months", { count: template.defaultMonths })}
                      </p>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}

      {/* Kdo mezi šablonami nenajde to svoje, nemá odejít. Šablona je
          zkratka, ne podmínka — vlastní cíl umí aplikace odjakživa. */}
      <p className="mt-16 border-t border-edge pt-8 text-base leading-relaxed text-[var(--color-paper-dim)]">
        {t("ownGoal")}{" "}
        <Link
          href={`/${locale}/app/goals/new`}
          className="text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
        >
          {t("ownGoalCta")}
        </Link>
      </p>
    </section>
  );
}
