"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    // Bez logu se chyba v produkci ztratí — digest umožní spárovat
    // hlášení uživatele se záznamem na serveru.
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <section className="grid min-h-[70dvh] place-items-center px-5">
      <div className="max-w-md text-center">
        <h1 className="display text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-[var(--color-paper-dim)]">{t("body")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            {t("retry")}
          </button>
          <Link href="/" className="btn-secondary">
            {t("home")}
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-[var(--color-paper-faint)]">
            {error.digest}
          </p>
        )}
      </div>
    </section>
  );
}
