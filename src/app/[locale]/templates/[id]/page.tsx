import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { graph, howToLd } from "@/lib/seo/jsonLd";
import { localeAlternates } from "@/lib/seo/metadata";
import { templateById, templates } from "@/content/templates";
import { locales, type Locale } from "@/i18n/routing";

/**
 * Jedna šablona, veřejně.
 *
 * Tahle stránka má dvojí život a oba jsou stejně důležité. Pro člověka
 * je to odpověď na „zvládnu to a co mě čeká?". Pro vyhledávač je to
 * jediná stránka na webu, která mluví o tom, co lidé doopravdy hledají —
 * ne o plánovači, ale o maratonu, o kreslení, o prvních zákaznících.
 *
 * Proto tu není jen slib. Je tu průběh plánu krok za krokem a věta
 * o tom, co se škrtne, až se přestane stíhat. To druhé nikdo jiný
 * dopředu neříká a je to zároveň to nejpoctivější, co se dá slíbit:
 * plán se se skutečností rozejde a tady stojí, co se stane pak.
 *
 * Všechny jazykové verze mají stejnou adresu, tedy `/cs/templates/marathon`
 * i `/de/templates/marathon`. Přeložená cesta by vyhledávači pomohla
 * jen nepatrně — váhu nese nadpis a text — a stála by za to, že by se
 * odkazy mezi jazyky rozešly při každé úpravě názvu.
 */

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    templates.map((template) => ({ locale, id: template.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const template = templateById(id);
  if (!template) return {};

  const text = template.text[locale as Locale];

  return {
    title: `${text.title} — AlmostThere`,
    description: text.pitch,
    ...localeAlternates(locale, `/templates/${id}`),
    openGraph: {
      type: "article",
      title: text.title,
      description: text.pitch,
      // Vlastní obrázek na každou šablonu. Dokud měly všechny ten
      // obecný, vypadal odkaz na maraton v chatu stejně jako odkaz na
      // kreslení — tedy jako reklama na aplikaci, ne jako ta věc,
      // kterou ten člověk zrovna řeší. Vyrábí se `npm run og`.
      images: [
        {
          url: `/og-template-${id}-${locale}.png`,
          width: 1200,
          height: 630,
          alt: text.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: text.title,
      description: text.pitch,
      images: [`/og-template-${id}-${locale}.png`],
    },
  };
}

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const template = templateById(id);
  if (!template) notFound();

  const text = template.text[locale as Locale];
  const t = await getTranslations({ locale, namespace: "templates" });

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <JsonLd
        data={graph(
          howToLd({
            locale: locale as Locale,
            id: template.id,
            name: text.title,
            description: text.pitch,
            months: template.defaultMonths,
            steps: text.phases.map((phase) => ({
              name: phase.when,
              text: phase.what,
            })),
          }),
        )}
      />

      <Link
        href={`/${locale}/templates`}
        className="text-sm text-[var(--color-paper-faint)] transition-colors hover:text-[var(--color-paper-dim)]"
      >
        ← {t("backToList")}
      </Link>

      <header className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-lime-soft)]">
          {t(`areas.${template.area}`)}
        </p>
        <h1 className="display mt-4 text-4xl leading-tight sm:text-5xl">
          {text.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-[var(--color-paper)]">
          {text.pitch}
        </p>
      </header>

      {/* Tlačítko nahoře i dole. Kdo je rozhodnutý po třech větách, nemá
          kvůli tomu projíždět celou stránku; kdo si ji přečte celou,
          nemá se kvůli tomu vracet nahoru. */}
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Link
          href={`/${locale}/app/goals/new?template=${template.id}`}
          className="btn-primary !px-6 !py-3"
        >
          {t("start")}
        </Link>
        <span className="text-sm text-[var(--color-paper-faint)]">
          {t("months", { count: template.defaultMonths })}
        </span>
      </div>

      <div className="card mt-12 p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
          {t("what")}
        </h2>
        <p className="mt-2.5 text-base leading-relaxed text-[var(--color-paper)]">
          {text.what}
        </p>

        <h2 className="mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
          {t("forWhom")}
        </h2>
        <p className="mt-2.5 text-base leading-relaxed text-[var(--color-paper)]">
          {text.forWhom}
        </p>
      </div>

      {/*
        Průběh plánu.

        Tohle je jádro stránky. Všechno ostatní je slib, tohle je to
        jediné, co se dá ověřit — a zároveň jediná část, kterou nemá
        nikdo jiný, protože vychází z odborného pokynu, podle kterého
        se plán opravdu staví.
      */}
      <h2 className="display mt-14 text-2xl">{t("shape")}</h2>
      <ol className="mt-6 space-y-6">
        {text.phases.map((phase, index) => (
          <li key={phase.when} className="flex gap-5">
            <span
              aria-hidden="true"
              className="display mt-0.5 shrink-0 text-2xl tabular-nums text-[var(--color-lime-soft)]"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-medium text-[var(--color-paper)]">
                {phase.when}
              </h3>
              <p className="mt-1.5 text-base leading-relaxed text-[var(--color-paper-dim)]">
                {phase.what}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Nejcennější věta na stránce. Každý plán se dřív nebo později
          rozejde se skutečností; tady stojí, co se stane pak. */}
      <div className="mt-12 rounded-2xl border border-edge p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
          {t("whenBehind")}
        </h2>
        <p className="mt-2.5 text-base leading-relaxed text-[var(--color-paper)]">
          {text.whenBehind}
        </p>
      </div>

      {/* Na co se zeptáme. Je férové to ukázat předem — a zároveň je to
          to nejpřesvědčivější: z těchhle tří odpovědí je vidět, že plán
          nebude pro každého stejný. */}
      <h2 className="display mt-14 text-2xl">{t("asks")}</h2>
      <ul className="mt-5 space-y-2.5">
        {text.questions.map((question) => (
          <li
            key={question.id}
            className="text-base leading-relaxed text-[var(--color-paper-dim)]"
          >
            {question.label}
          </li>
        ))}
      </ul>

      <div className="mt-14 border-t border-edge pt-10">
        <p className="text-lg leading-relaxed text-[var(--color-paper)]">
          {t("closing")}
        </p>
        <Link
          href={`/${locale}/app/goals/new?template=${template.id}`}
          className="btn-primary mt-6 inline-flex !px-6 !py-3"
        >
          {t("start")}
        </Link>
      </div>
    </article>
  );
}
