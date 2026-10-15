import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthShell, Divider } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return {
    // Do vyhledávání tahle stránka nepatří: je krátká, ve všech jazycích
    // skoro stejná a nikomu, kdo něco hledá, nic nenabídne. Google takové
    // stránky vyhodnotí jako duplicity a vybere si k nim vlastní
    // kanonickou adresu — a přesně to hlásí zprávou o duplicitní stránce.
    robots: { index: false, follow: true },
    title: `${t("title")} — AlmostThere`,
  };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;

  /*
   * Kam po přihlášení.
   *
   * Bere se jen vlastní cesta, ne celá adresa: `callbackUrl` přichází
   * z adresního řádku a kdyby se použil, jak přijde, dal by se tím
   * člověk po přihlášení poslat na cizí web. Otevřené přesměrování je
   * klasická díra a stojí jednu podmínku.
   */
  const requested = (await searchParams).callbackUrl;
  const back =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : `/${locale}/app`;
  setRequestLocale(locale);
  return <LoginContent locale={locale} back={back} />;
}

function LoginContent({
  locale,
  back,
}: {
  locale: string;
  back: string;
}) {
  const t = useTranslations("auth.login");

  return (
    <AuthShell
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link
            href={`/${locale}/register?callbackUrl=${encodeURIComponent(back)}`}
            className="font-medium text-[var(--color-lime-soft)] underline underline-offset-4"
          >
            {t("registerLink")}
          </Link>
        </>
      }
    >
      {/* useSearchParams vyžaduje Suspense, jinak by se stránka
          nedala předgenerovat staticky. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <div className="mt-4 text-right">
        <Link
          href="/forgot-password"
          className="text-sm text-[var(--color-paper-dim)] underline underline-offset-4 hover:text-[var(--color-paper)]"
        >
          {t("forgotLink")}
        </Link>
      </div>

      {/*
        V aplikaci z obchodu se přihlášení Googlem schovává.

        Aplikace je webview a Google v něm přihlašování ke svým účtům
        zakazuje — tlačítko by skončilo chybovou stránkou. Místo něj se
        ukáže, co má člověk udělat: nastavit si k účtu heslo. Účet přes
        Google tím nepřestává platit, heslo se k němu jen přidá.

        Přes CSS a značku na `<html>`, ne přes hlavičku požadavku —
        stránka tak zůstane předgenerovaná a nic neproblikne.
      */}
      <div className="store-hidden">
        <Divider label={t("or")} />
        {/* Návratová adresa i tady. Bez toho by přihlášení Googlem
            skončilo na dnešku a rozdělaná aktivace Vision Boardu by
            se ztratila. */}
        <GoogleButton label={t("google")} callbackUrl={back} />
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
