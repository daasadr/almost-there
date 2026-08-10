import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { localeAlternates } from "@/lib/seo/metadata";

/**
 * Návod, jak dostat appku do telefonu.
 *
 * Existuje kvůli jedné praktické potíži: „přidat na plochu“ je na iPhonu
 * schované ve sdílení a skoro nikdo o tom neví. Poslat kamarádce odkaz na
 * tuhle stránku je spolehlivější než jí to popisovat ve zprávě.
 *
 * Obchod tu schválně není potřeba. Na iPhonu ani žádná cesta přes obchod
 * není — appka se přidává z prohlížeče a je to plnohodnotné řešení, ne
 * náhražka.
 *
 * Odkaz na instalační soubor pro Android se ukáže, jen když je nastavená
 * NEXT_PUBLIC_APK_URL. Dokud soubor nikde neleží, nemá smysl na něj
 * odkazovat — rozbitý odkaz ke stažení vypadá hůř než žádný.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "install" });

  return {
    title: `${t("title")} — AlmostThere`,
    description: t("intro"),
    alternates: localeAlternates(locale, "/install"),
  };
}

export default async function InstallPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Content />;
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-5 space-y-3 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3.5">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-[var(--color-paper-faint)]"
          >
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Content() {
  const t = useTranslations("install");
  const apkUrl = process.env.NEXT_PUBLIC_APK_URL;

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="display text-3xl sm:text-4xl">{t("title")}</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("intro")}
      </p>

      <div className="card mt-10 p-6 sm:p-8">
        <h2 className="display text-xl">{t("iphoneTitle")}</h2>
        <Steps steps={t.raw("iphoneSteps") as string[]} />
        <p className="mt-5 text-sm leading-relaxed text-[var(--color-paper-faint)]">
          {t("iphoneNote")}
        </p>
      </div>

      <div className="card mt-6 p-6 sm:p-8">
        <h2 className="display text-xl">{t("androidTitle")}</h2>
        <Steps steps={t.raw("androidSteps") as string[]} />
        <p className="mt-5 text-sm leading-relaxed text-[var(--color-paper-faint)]">
          {t("androidNote")}
        </p>
      </div>

      {apkUrl && (
        <div className="card mt-6 p-6 sm:p-8">
          <h2 className="display text-xl">{t("apkTitle")}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
            {t("apkBody")}
          </p>
          <a
            href={apkUrl}
            className="btn-primary mt-6 inline-block"
            download
          >
            {t("apkButton")}
          </a>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h2 className="text-sm font-semibold text-[var(--color-paper)]">
          {t("accountTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-paper-dim)]">
          {t("accountBody")}
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <Link href="/demo" className="btn-primary">
          {t("demo")}
        </Link>
        <Link
          href="/"
          className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
        >
          ← {t("back")}
        </Link>
      </div>
    </section>
  );
}
