import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
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

/**
 * Oddíly překladů, které potřebují komponenty běžící v prohlížeči.
 *
 * Zjištěno projitím všech souborů s „use client": formuláře, checklist,
 * paywall, demo, přepínač jazyka a lišta o cookies. Zbytek — úvodní
 * stránka, otázky, právní texty, e-maily — se vykresluje na serveru
 * a klient je nikdy nepotřebuje.
 */
const CLIENT_NAMESPACES = [
  "nav",
  "cookies",
  "error",
  "auth",
  "billing",
  "demo",
  "plan",
] as const;

function clientMessages(messages: Record<string, unknown>) {
  return Object.fromEntries(
    CLIENT_NAMESPACES.filter((key) => key in messages).map((key) => [
      key,
      messages[key],
    ]),
  );
}

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
  };
}

/**
 * Chování stránky vůči hranám displeje.
 *
 * `viewportFit: "cover"` říká, že obsah smí pod systémové lišty — bez
 * toho zůstane `env(safe-area-inset-*)` na nule a odsazení v CSS by
 * nemělo z čeho počítat.
 *
 * Od Androidu 15 se aplikace kreslí přes celý displej samy od sebe
 * a iPhone má výřez odjakživa. Obojí řeší tytéž odsazení v globals.css:
 * pozadí sahá až k hraně, ale text a tlačítka zůstanou pod lištou.
 */
export const viewport: Viewport = {
  themeColor: "#04100c",
  viewportFit: "cover",
};

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

  const messages = await getMessages();

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
        {/*
          Do prohlížeče jdou jen oddíly, které opravdu potřebuje komponenta
          běžící na klientovi.

          Bez výběru posílá next-intl všechny překlady — a ty už mají přes
          čtyřicet kilobajtů. Byly by v každé odpovědi, i na úvodní stránce,
          kde z nich klient využije dva krátké oddíly. Texty vykreslené na
          serveru se tím nemění: ty se do HTML dostanou hotové.

          Když přibude komponenta s „use client", která sahá do dalšího
          oddílu, musí se sem dopsat — jinak jí zůstane holý klíč. Ověřit
          to jde příkazem:
            grep -rl '"use client"' src | xargs grep -o 'useTranslations("[^"]*"'
        */}
        <NextIntlClientProvider messages={clientMessages(messages)}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--color-lime-soft)] focus:px-5 focus:py-2 focus:font-semibold focus:text-[var(--color-ink-950)]"
          >
            Skip to content
          </a>
          {/* Obal drží pojistku proti vodorovnému posuvníku. Na `html`
              ani `body` patřit nesmí — viz komentář u `.page-shell`
              v globals.css. */}
          <div className="page-shell">
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
          </div>
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
