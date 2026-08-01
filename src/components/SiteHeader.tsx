"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogoMark, Wordmark } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function SiteHeader() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);

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

        <nav className="ml-auto hidden items-center gap-7 text-sm text-[var(--color-paper-dim)] md:flex">
          <a href="#how" className="transition hover:text-[var(--color-paper)]">
            {t("howItWorks")}
          </a>
          <a
            href="#features"
            className="transition hover:text-[var(--color-paper)]"
          >
            {t("features")}
          </a>
          <a
            href="#pricing"
            className="transition hover:text-[var(--color-paper)]"
          >
            {t("pricing")}
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <LocaleSwitcher />
          <Link
            href="/demo"
            className="hidden rounded-full border border-white/10 px-4 py-1.5 text-sm font-medium text-[var(--color-paper-dim)] transition hover:border-white/25 hover:text-[var(--color-paper)] sm:inline-flex"
          >
            {t("demo")}
          </Link>
        </div>
      </div>
    </header>
  );
}
