import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CookieBanner } from "@/components/CookieBanner";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { AuthSessionProvider } from "@/components/SessionProvider";
import { ServiceWorker } from "@/components/ServiceWorker";
import { NativeShell } from "@/components/native/NativeShell";
import { STORE_APP_MARKER } from "@/lib/store-app";
import { siteUrl } from "@/lib/seo/site";
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
    // Bez tohohle by relativní adresy v náhledech zůstaly relativní —
    // a odkaz sdílený mimo web by pak ukazoval na nic.
    metadataBase: new URL(siteUrl()),
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale,
      siteName: "AlmostThere",
      url: `/${locale}`,
      // Obrázek, který se ukáže u sdíleného odkazu — ve zprávách, na
      // sociálních sítích i u citace v odpovědi jazykového modelu.
      // Vyrábí se příkazem `npm run og`.
      images: [
        {
          url: `/og-${locale}.png`,
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`/og-${locale}.png`],
    },
    icons: {
      icon: "/icon.svg",
      apple: "/apple-touch-icon.png",
    },
    // Po instalaci na plochu iPhonu se appka spustí bez adresního řádku
    // a s tmavým stavovým pruhem. Bez tohohle by vypadala jako web
    // otevřený v Safari.
    appleWebApp: {
      capable: true,
      title: "AlmostThere",
      statusBarStyle: "black-translucent",
    },
    // Barva panelu prohlížeče i horní lišty nainstalované appky.
    other: { "theme-color": "#04100c" },
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
    <html lang={locale}>
      <head>
        {/* Předběžné načtení základní latinky — bez toho se text na okamžik
            vykreslí náhradním písmem a pak přeskočí. */}
        <link
          rel="preload"
          href="/fonts/instrument-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/bricolage-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Starší iPhony neumí spustit web na celou obrazovku podle
            manifestu a řídí se jen touhle značkou. Next ji sám nevydává —
            posílá novější `mobile-web-app-capable`, kterou iOS začal
            rozumět až od verze 16.4. Bez tohohle by se na starším
            telefonu appka po přidání na plochu otevřela v Safari
            s adresním řádkem. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />

        {/* Značka pro aplikaci z obchodu, podle které se schová všechno,
            co vede k placení mimo obchod. Musí běžet tady v hlavičce,
            ještě před vykreslením — kdyby se čekalo na hydrataci,
            tlačítko „koupit" by na okamžik probliklo. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(navigator.userAgent.indexOf(${JSON.stringify(STORE_APP_MARKER)})>-1)document.documentElement.dataset.storeApp="1"`,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <AuthSessionProvider>
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
          <ServiceWorker />
          <NativeShell />
        </NextIntlClientProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
