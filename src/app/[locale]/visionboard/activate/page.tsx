import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { ActivationConfirm } from "@/components/visionboard/ActivationConfirm";
import {
  readParams,
  recallActivation,
  rememberActivation,
} from "@/lib/visionboard/pending";

/**
 * Aktivace Vision Boardu na tomhle počítači.
 *
 * Sem přijde uživatel z aplikace: ta otevře prohlížeč, člověk potvrdí
 * a kód putuje zpátky do aplikace odkazem `visionboard://`.
 *
 * ── Kód se nevydá otevřením adresy ──────────────────────────────────
 *
 * Jen potvrzením, tedy POSTem. Kdyby stačilo adresu otevřít, stačilo by
 * podstrčit přihlášenému člověku odkaz — a jeho licence by odešla na
 * cizí počítač, aniž by o tom věděl. Kontrakt, oddíl 8.
 *
 * ── Proč si parametry pamatujeme v cookie ───────────────────────────
 *
 * Nepřihlášený musí nejdřív přes přihlášení nebo registraci a ty tři
 * údaje z adresy to musí přežít. Registrace jde přes ověřovací e-mail,
 * takže návratová adresa s parametry by se musela protáhnout i odkazem
 * v mailu. Cookie přežije všechny tři cesty stejně — a `challenge` se
 * tím nedostane do historie prohlížeče ani do logu. Viz `pending.ts`.
 */

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ActivatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    challenge?: string;
    state?: string;
    platform?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "visionboard.activate" });

  // Parametry z adresy mají přednost; bez nich platí, co jsme si
  // zapamatovali. Druhá cesta nastane při návratu z přihlášení.
  const fromUrl = readParams(await searchParams);
  if (fromUrl) await rememberActivation(fromUrl);

  const pending = fromUrl ?? (await recallActivation());

  if (!pending) {
    return (
      <Shell title={t("missingTitle")}>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("missingBody")}
        </p>
      </Shell>
    );
  }

  const session = await auth();

  if (!session?.user) {
    // Návratová adresa je holá. Parametry neseme v cookie, ne v ní.
    const back = encodeURIComponent(`/${locale}/visionboard/activate`);

    return (
      <Shell title={t("signInTitle")}>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("signInBody")}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-5">
          <Link
            href={`/${locale}/login?callbackUrl=${back}`}
            className="btn-primary !px-6 !py-3"
          >
            {t("signIn")}
          </Link>
          <Link
            href={`/${locale}/register?callbackUrl=${back}`}
            className="text-sm text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
          >
            {t("register")}
          </Link>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-[var(--color-paper-faint)]">
          {t("signInNote")}
        </p>
      </Shell>
    );
  }

  return (
    <Shell title={t("confirmTitle")}>
      <p className="mt-4 text-base leading-relaxed text-[var(--color-paper)]">
        {t("confirmBody")}
      </p>
      <p className="mt-3 text-sm text-[var(--color-paper-faint)]">
        {t("confirmAccount", { email: session.user.email ?? "" })}
      </p>

      <ActivationConfirm />

      <p className="mt-6 text-sm leading-relaxed text-[var(--color-paper-faint)]">
        {t("confirmNote")}
      </p>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-xl px-5 py-20 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-lime-soft)]">
        Vision Board
      </p>
      <h1 className="display mt-4 text-3xl leading-tight">{title}</h1>
      {children}
    </section>
  );
}
