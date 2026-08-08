"use client";

import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";

/**
 * Tlačítka na úvodní stránce, která berou ohled na přihlášení.
 *
 * Stránka zůstává staticky předgenerovaná — hydratuje se jen tenhle kousek.
 * Než se stav načte, ukazuje se varianta pro nepřihlášené: tak vypadá
 * i statické HTML, takže nedojde k nesouladu při hydrataci, a odpovídá to
 * drtivé většině návštěvníků.
 *
 * Přihlášenému nenabízíme koupi ani demo. Kam patří — jestli na paywall,
 * nebo rovnou k cílům — rozhodne až aplikace podle stavu předplatného.
 * Úvodní stránka o předplatném vědět nepotřebuje.
 */
export function LandingCta({
  primaryLabel,
  primaryHref = "/demo",
  appLabel,
  secondaryLabel,
  fullWidth = false,
}: {
  primaryLabel: string;
  /** Kam vede hlavní tlačítko nepřihlášeného. Ceník posílá rovnou
   *  na registraci — kdo chce koupit, nemá skončit v demu. */
  primaryHref?: "/demo" | "/register";
  appLabel: string;
  /** Vedlejší tlačítko odkazuje na ceník. Když chybí, nevykreslí se. */
  secondaryLabel?: string;
  fullWidth?: boolean;
}) {
  const { status } = useSession();
  const wide = fullWidth ? "w-full sm:w-auto" : "";

  if (status === "authenticated") {
    return (
      <Link href="/app" className={`btn-primary ${wide}`}>
        {appLabel}
      </Link>
    );
  }

  return (
    <>
      <Link href={primaryHref} className={`btn-primary ${wide}`}>
        {primaryLabel}
      </Link>
      {secondaryLabel && (
        <a href="#pricing" className="btn-secondary">
          {secondaryLabel}
        </a>
      )}
    </>
  );
}
