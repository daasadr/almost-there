"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";

/**
 * Přepínač jazyků. Nativní `<select>` schválně — na mobilu se otevře
 * systémový výběr a nemusíme řešit vlastní dropdown a jeho přístupnost.
 */
export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value as Locale;

          // Přihlášenému si volbu zapamatujeme na účtu — podle ní chodí
          // e-maily a zakládají se nové cíle. Přepnutí jazyka na to nemá
          // čekat, takže se odpověď neřeší; nepřihlášenému skončí na 401
          // a nic se nestane.
          void fetch("/api/account/locale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: next }),
          }).catch(() => {});

          startTransition(() => {
            // `params` drží případné dynamické segmenty aktuální cesty.
            router.replace(
              // @ts-expect-error — pathname je typovaný na známé cesty,
              // ale tady předáváme aktuální cestu za běhu.
              { pathname, params },
              { locale: next },
            );
          });
        }}
        className="cursor-pointer appearance-none rounded-full border border-white/10 bg-white/5 py-1.5 pl-3 pr-8 text-sm text-[var(--color-paper-dim)] transition hover:border-white/25 hover:text-[var(--color-paper)]"
      >
        {locales.map((code) => (
          <option key={code} value={code} className="bg-[var(--color-ink-900)]">
            {localeNames[code]}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 8"
        className="pointer-events-none absolute right-3 h-2 w-3 fill-none stroke-current stroke-[1.6] text-[var(--color-paper-faint)]"
      >
        <path d="M1 1.5 6 6.5 11 1.5" strokeLinecap="round" />
      </svg>
    </label>
  );
}
