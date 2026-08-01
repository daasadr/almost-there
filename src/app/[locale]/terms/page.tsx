import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalDocumentView } from "@/components/LegalDocumentView";
import { termsByLocale } from "@/content/legal";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });
  return { title: `${t("title")} — AlmostThere` };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal.terms" });

  return (
    <LegalDocumentView
      title={t("title")}
      document={termsByLocale[locale as Locale]}
      locale={locale}
    />
  );
}
