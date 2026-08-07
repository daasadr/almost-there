import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthShell, Divider } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.register" });
  return { title: `${t("title")} — AlmostThere` };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RegisterContent locale={locale} />;
}

function RegisterContent({ locale }: { locale: string }) {
  const t = useTranslations("auth.register");

  return (
    <AuthShell
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--color-lime-soft)] underline underline-offset-4"
          >
            {t("loginLink")}
          </Link>
        </>
      }
    >
      <RegisterForm />

      <Divider label={t("or")} />

      {/* Přihlášením přes Google uživatel prochází touhle stránkou, kde je
          souhlas s podmínkami uvedený u tlačítka — nesmí chybět ani tady. */}
      <GoogleButton label={t("google")} callbackUrl={`/${locale}/app`} />
      <p className="mt-3 text-center text-xs leading-relaxed text-[var(--color-paper-faint)]">
        {t.rich("googleConsent", {
          terms: (chunks) => (
            <Link href="/terms" target="_blank" className="underline">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/privacy" target="_blank" className="underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </AuthShell>
  );
}
