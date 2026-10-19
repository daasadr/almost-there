import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthShell, Divider } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { rememberReferrer } from "@/lib/visionboard/invite";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.register" });
  return {
    // Do vyhledávání tahle stránka nepatří: je krátká, ve všech jazycích
    // skoro stejná a nikomu, kdo něco hledá, nic nenabídne. Google takové
    // stránky vyhodnotí jako duplicity a vybere si k nim vlastní
    // kanonickou adresu — a přesně to hlásí zprávou o duplicitní stránce.
    robots: { index: false, follow: true },
    title: `${t("title")} — AlmostThere`,
  };
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; ref?: string }>;
}) {
  const { locale } = await params;

  // Jen vlastní cesta, ne celá adresa — jinak by šlo člověka po
  // registraci poslat na cizí web.
  const query = await searchParams;

  // Pozvánka se zapamatuje hned při příchodu. Mezi klepnutím na odkaz
  // a odesláním formuláře je několik kroků a uživatel si může odskočit.
  if (query.ref) await rememberReferrer(query.ref);

  const requested = query.callbackUrl;
  const back =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : `/${locale}/app`;
  setRequestLocale(locale);
  return <RegisterContent locale={locale} back={back} />;
}

function RegisterContent({
  locale,
  back,
}: {
  locale: string;
  back: string;
}) {
  const t = useTranslations("auth.register");

  return (
    <AuthShell
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("hasAccount")}{" "}
          <Link
            href={`/${locale}/login?callbackUrl=${encodeURIComponent(back)}`}
            className="font-medium text-[var(--color-lime-soft)] underline underline-offset-4"
          >
            {t("loginLink")}
          </Link>
        </>
      }
    >
      <RegisterForm />

      {/* V aplikaci z obchodu se registrace přes Google schovává — viz
          komentář u přihlašovací stránky. */}
      <div className="store-hidden">
        <Divider label={t("or")} />

        {/* Přihlášením přes Google uživatel prochází touhle stránkou, kde je
            souhlas s podmínkami uvedený u tlačítka — nesmí chybět ani tady. */}
        <GoogleButton label={t("google")} callbackUrl={back} />
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
      </div>

      <p className="store-only mt-6 rounded-2xl border border-edge bg-surface p-4 text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {t.rich("storeNote", {
          link: (chunks) => (
            <Link
              href="/forgot-password"
              className="text-[var(--color-lime-soft)] underline underline-offset-4"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </AuthShell>
  );
}
