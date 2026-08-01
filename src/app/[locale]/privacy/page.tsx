import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalDocumentView } from "@/components/LegalDocumentView";
import { privacyByLocale } from "@/content/legal";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return { title: `${t("title")} — AlmostThere` };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal.privacy" });

  return (
    <LegalDocumentView
      title={t("title")}
      document={privacyByLocale[locale as Locale]}
      locale={locale}
    />
  );
}
