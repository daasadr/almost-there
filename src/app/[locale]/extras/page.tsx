import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MusicPlayer } from "@/components/extras/MusicPlayer";
import { tracks } from "@/content/music";
import { motivationByLocale } from "@/content/motivation";
import { localeAlternates } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";

/**
 * Extra — co aplikace dává navíc.
 *
 * Vzniklo z toho, že těch věcí přibývá: myšlenka na den, hudba a brzy
 * nástroj na nástěnku snů. Do hlavního menu nepatří — to má tři položky
 * (dnešek, cíle, účet) a čtvrtá by rozbila poměr, který funguje. Zato
 * schovat je do nastavení by znamenalo, že je nikdo nenajde.
 *
 * Proto vlastní stránka a tlačítko v hlavičce, vedle přepínače vzhledu.
 *
 * Stránka je veřejná. Nic z toho se neplatí a je to zároveň to
 * nejsdílenější, co aplikace má — texty i hudba můžou přivést lidi
 * zvenčí, pokud se k nim dostanou bez účtu.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "extras" });

  return {
    title: `${t("title")} — AlmostThere`,
    description: t("intro"),
    alternates: localeAlternates(locale, "/extras"),
  };
}

export default async function ExtrasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "extras" });
  const pieces = motivationByLocale[locale as Locale] ?? [];

  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="display mt-6 text-3xl sm:text-4xl">{t("title")}</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-paper-dim)]">
        {t("intro")}
      </p>

      {/* ── Myšlenka na den ─────────────────────────────────────── */}
      <div className="mt-14">
        <h2 className="display text-xl">{t("thoughts.title")}</h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("thoughts.body")}
        </p>

        {pieces.length > 0 && (
          <ul className="mt-5 space-y-2">
            {pieces.map((piece, index) => (
              <li key={piece.title}>
                <Link
                  href={`/motivation/${index + 1}`}
                  className="card card-hover block px-4 py-3 text-base"
                >
                  {piece.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Hudba ───────────────────────────────────────────────── */}
      <div className="mt-14">
        <h2 className="display text-xl">{t("music.title")}</h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-[var(--color-paper-dim)]">
          {t("music.body")}
        </p>

        <div className="mt-5">
          {tracks.length > 0 ? (
            <MusicPlayer tracks={tracks} />
          ) : (
            /* Prázdný seznam se přizná. Nadpis bez obsahu vypadá jako
               rozbitá stránka, tahle věta jako příslib. */
            <p className="card p-5 text-sm text-[var(--color-paper-dim)]">
              {t("music.empty")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
