import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OrderForm } from "@/components/pdf-plans/OrderForm";
import { pdfPlanTemplates, templateById } from "@/content/pdf-plans";
import { todayIso } from "@/lib/plan/calendar";
import { localeAlternates, pageSocial } from "@/lib/seo/metadata";
import { locales, type Locale } from "@/i18n/routing";

/**
 * Stránka jedné šablony se zadáním a platbou.
 *
 * `custom` je tatáž stránka bez šablony — vlastní cíl není horší
 * volba, jen nemá předem připravené pokyny pro model.
 *
 * Nepředgenerovává se: formulář potřebuje vědět, jestli je člověk
 * přihlášený, a hlavně dnešek v jeho pásmu, aby se termín i cena
 * počítaly ze správného dne.
 */

const CUSTOM = "custom";

export function generateStaticParams() {
  return locales.flatMap((locale) => [
    ...pdfPlanTemplates.map((template) => ({ locale, template: template.id })),
    { locale, template: CUSTOM },
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; template: string }>;
}): Promise<Metadata> {
  const { locale, template: id } = await params;
  const t = await getTranslations({ locale, namespace: "pdfPlans" });
  const template = id === CUSTOM ? undefined : templateById(id);

  if (id !== CUSTOM && !template) return {};

  const text = template?.text[locale as Locale];
  const title = text?.title ?? t("customTitle");
  const description = text?.pitch ?? t("customBody");
  const path = `/pdf-plans/${id}`;

  return {
    title: `${title} — AlmostThere`,
    description,
    ...localeAlternates(locale, path),
    ...pageSocial({
      locale,
      path,
      title,
      description,
      image: `/og-${locale}.png`,
    }),
  };
}

export default async function PdfPlanTemplatePage({
  params,
}: {
  params: Promise<{ locale: string; template: string }>;
}) {
  const { locale, template: id } = await params;
  setRequestLocale(locale);

  const template = id === CUSTOM ? undefined : templateById(id);
  if (id !== CUSTOM && !template) notFound();

  const t = await getTranslations({ locale, namespace: "pdfPlans" });
  const text = template?.text[locale as Locale];

  const session = await auth();
  const signedIn = Boolean(session?.user?.id);

  /*
   * Dnešek v pásmu uživatele. Podle něj se počítá délka plánu, takže
   * i cena — u někoho za datovou hranicí by prohlížečův dnešek dal
   * o den jiný výsledek než server a na hranici pásma o padesát
   * korun jinou cenu.
   */
  const timezone = session?.user?.id
    ? ((
        await db.user.findUnique({
          where: { id: session.user.id },
          select: { timezone: true },
        })
      )?.timezone ?? "Europe/Prague")
    : "Europe/Prague";

  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="text-sm">
        <Link
          href={`/${locale}/pdf-plans`}
          className="text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
        >
          ← {t("metaTitle")}
        </Link>
      </p>

      <h1 className="display mt-5 text-3xl leading-tight sm:text-4xl">
        {text?.title ?? t("customTitle")}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-[var(--color-paper-dim)]">
        {text?.pitch ?? t("customBody")}
      </p>

      {text && (
        <>
          <ol className="mt-8 space-y-3">
            {text.outline.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 text-sm tabular-nums text-[var(--color-paper-faint)]"
                >
                  {i + 1}.
                </span>
                <span className="text-base leading-relaxed text-[var(--color-paper)]">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-7">
            <a
              href={`/samples/plan-${locale}.pdf`}
              className="text-sm font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
            >
              {t("sampleCta")} →
            </a>
          </p>
        </>
      )}

      <h2 className="display mt-14 text-2xl">{t("formTitle")}</h2>

      <OrderForm
        templateId={template?.id}
        defaultGoal={text?.goal ?? ""}
        suggestedWeeks={template?.suggestedWeeks ?? 8}
        signedIn={signedIn}
        today={todayIso(timezone)}
      />
    </article>
  );
}
