import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/PasswordForms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.forgot" });
  return {
    // Do vyhledávání tahle stránka nepatří: je krátká, ve všech jazycích
    // skoro stejná a nikomu, kdo něco hledá, nic nenabídne. Google takové
    // stránky vyhodnotí jako duplicity a vybere si k nim vlastní
    // kanonickou adresu — a přesně to hlásí zprávou o duplicitní stránce.
    robots: { index: false, follow: true },
    title: `${t("title")} — AlmostThere`,
  };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ForgotContent />;
}

function ForgotContent() {
  const t = useTranslations("auth.forgot");

  return (
    <AuthShell
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <Link
          href="/login"
          className="font-medium text-[var(--color-lime-soft)] underline underline-offset-4"
        >
          {t("backToLogin")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
