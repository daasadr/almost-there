import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogoMark, Wordmark } from "./Logo";

export function SiteFooter() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-[var(--color-ink-900)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-7 w-7" />
              <Wordmark />
            </div>
            <p className="mt-3 max-w-xs text-sm text-[var(--color-paper-dim)]">
              {t("tagline")}
            </p>
            <p className="mt-6 max-w-xs text-sm text-[var(--color-paper-faint)]">
              {t("madeWith")}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-paper-faint)]">
              {t("product")}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--color-paper-dim)]">
              <li>
                <Link href="/demo" className="transition hover:text-[var(--color-paper)]">
                  {nav("demo")}
                </Link>
              </li>
              <li>
                <Link href="/" className="transition hover:text-[var(--color-paper)]">
                  {nav("howItWorks")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-paper-faint)]">
              {t("legal")}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--color-paper-dim)]">
              <li>
                <Link href="/terms" className="transition hover:text-[var(--color-paper)]">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition hover:text-[var(--color-paper)]">
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/5 pt-6 text-xs text-[var(--color-paper-faint)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} AlmostThere. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
