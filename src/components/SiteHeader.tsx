"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, usePathname } from "@/i18n/navigation";
import { LogoMark, Wordmark } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";

/**
 * Kotvy na úvodní stránce, na které míří odkazy v hlavičce.
 * Klíč sekce → klíč popisku ve zprávách.
 */
const SECTIONS = {
  how: "howItWorks",
  features: "features",
  pricing: "pricing",
  faq: "faq",
} as const;

/**
 * Odkaz na sekci úvodní stránky.
 *
 * Na úvodní stránce je to obyčejná kotva a prohlížeč jen odroluje.
 * Odjinud — z podmínek, ze zásad, z dema — musí odkaz nejdřív dovést
 * uživatele na úvodní stránku; samotná kotva by tam nenašla nic
 * a tlačítko by vypadalo rozbitě.
 */
function SectionLink({
  section,
  onLanding,
  label,
}: {
  section: string;
  onLanding: boolean;
  label: string;
}) {
  // Ceník se v aplikaci z obchodu neukazuje — viz lib/store-app.ts.
  const className = `transition hover:text-[var(--color-paper)] ${
    section === "pricing" ? "store-hidden" : ""
  }`;

  if (onLanding) {
    return (
      <a href={`#${section}`} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={`/#${section}`} className={className}>
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const { status } = useSession();
  const pathname = usePathname();

  // Odkazy v hlavičce míří na kotvy úvodní stránky. V účtu a ve správě
  // žádné takové sekce nejsou, takže by to byla tři tlačítka, která nikam
  // nevedou — a uživatel netuší, jestli je rozbitá stránka, nebo on.
  const isAppSection = ["/app", "/admin"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const onLanding = pathname === "/";

  // Hlavička je průhledná nad hero sekcí a po odscrollování ztmavne,
  // aby text pod ní nesplýval s pozadím.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled
          ? "border-b border-white/5 bg-[color-mix(in_oklab,var(--color-ink-950)_82%,transparent)] backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      {/* Na mobilu menší mezery i okraje. S původními se řádek nevešel do
          šířky displeje a stránka dostala vodorovný posuvník. */}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:gap-6 sm:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <LogoMark className="h-7 w-7" />
          {/* Na nejužších displejích zůstane jen značka. Napsaný název je
              to první, co se dá obětovat — logo mluví samo za sebe. */}
          <Wordmark className="hidden min-[360px]:inline-block" />
        </Link>

        {!isAppSection && (
          <nav className="ml-auto hidden items-center gap-7 text-sm text-[var(--color-paper-dim)] md:flex">
            {Object.entries(SECTIONS).map(([section, label]) => (
              <SectionLink
                key={section}
                section={section}
                onLanding={onLanding}
                label={t(label)}
              />
            ))}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {/* Přepínač jazyka je na mobilu v patičce. V hlavičce je z něj
              nejširší prvek a vytlačil by odsud přihlášení. */}
          <span className="hidden sm:inline-flex">
            <LocaleSwitcher />
          </span>

          {/* Stav přihlášení se dotahuje na klientovi, aby stránky
              zůstaly staticky předgenerované. */}
          {status === "authenticated" ? (
            <Link href="/app" className="btn-primary !px-4 !py-1.5 text-sm">
              {t("account")}
            </Link>
          ) : (
            <>
              {/* Na mobilu bez rámečku, ale vždy vidět. Dřív se schovávalo
                  úplně a z telefonu se nedalo přihlásit. */}
              <Link
                href="/login"
                className="whitespace-nowrap text-sm font-medium text-[var(--color-paper-dim)] transition hover:text-[var(--color-paper)] sm:rounded-full sm:border sm:border-white/10 sm:px-4 sm:py-1.5 sm:hover:border-white/25"
              >
                {t("login")}
              </Link>
              <Link
                href="/demo"
                className="btn-primary whitespace-nowrap !px-4 !py-1.5 text-sm"
              >
                {/* Delší popisek se na úzký displej nevejde. */}
                <span className="sm:hidden">{t("demoShort")}</span>
                <span className="hidden sm:inline">{t("demo")}</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
