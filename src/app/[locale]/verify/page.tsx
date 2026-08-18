import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyClient } from "@/components/auth/VerifyClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.verify" });
  return {
    // Do vyhledávání tahle stránka nepatří: je krátká, ve všech jazycích
    // skoro stejná a nikomu, kdo něco hledá, nic nenabídne. Google takové
    // stránky vyhodnotí jako duplicity a vybere si k nim vlastní
    // kanonickou adresu — a přesně to hlásí zprávou o duplicitní stránce.
    robots: { index: false, follow: true },
    title: `${t("title")} — AlmostThere`,
  };
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <VerifyContent />;
}

function VerifyContent() {
  const t = useTranslations("auth.verify");

  return (
    <AuthShell title={t("title")}>
      <Suspense fallback={null}>
        <VerifyClient />
      </Suspense>
    </AuthShell>
  );
}
