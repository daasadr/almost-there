import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { bricolage, instrument } from "@/app/fonts";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CookieBanner } from "@/components/CookieBanner";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import "@/app/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale,
    },
    icons: {
      icon: "/icon.svg",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Bez tohohle by statické generování stránek spadlo zpět na dynamické.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${bricolage.variable} ${instrument.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--color-lime-soft)] focus:px-5 focus:py-2 focus:font-semibold focus:text-[var(--color-ink-950)]"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <CookieBanner />
          <RevealOnScroll />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
