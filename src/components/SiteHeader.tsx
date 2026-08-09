"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, usePathname } from "@/i18n/navigation";
import { LogoMark, Wordmark } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";

/** Kotvy na úvodní stránce, na které míří odkazy v hlavičce. */
const SECTIONS = ["how", "features", "pricing"] as const;

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
  const className = "transition hover:text-[var(--color-paper)]";

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
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <LogoMark className="h-7 w-7" />
          <Wordmark />
        </Link>

        {!isAppSection && (
          <nav className="ml-auto hidden items-center gap-7 text-sm text-[var(--color-paper-dim)] md:flex">
            {SECTIONS.map((section) => (
              <SectionLink
                key={section}
                section={section}
                onLanding={onLanding}
                label={t(section === "how" ? "howItWorks" : section === "features" ? "features" : "pricing")}
              />
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          <LocaleSwitcher />
          {/* Stav přihlášení se dotahuje na klientovi, aby stránky
              zůstaly staticky předgenerované. */}
          {status === "authenticated" ? (
            <Link href="/app" className="btn-primary !px-4 !py-1.5 text-sm">
              {t("account")}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full border border-white/10 px-4 py-1.5 text-sm font-medium text-[var(--color-paper-dim)] transition hover:border-white/25 hover:text-[var(--color-paper)] sm:inline-flex"
              >
                {t("login")}
              </Link>
              <Link href="/demo" className="btn-primary !px-4 !py-1.5 text-sm">
                {t("demo")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
