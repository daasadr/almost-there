import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CONTACT_EMAIL } from "@/content/legal";
import { localeAlternates } from "@/lib/seo/metadata";

/**
 * Veřejný návod, jak si zrušit účet.
 *
 * Musí být dostupný bez přihlášení a bez instalace aplikace — Google Play
 * si adresu vyžádá do formuláře a jejich recenzent ji navštíví jako
 * kdokoliv jiný. Samotné mazání je v nastavení za přihlášením; tady stojí,
 * kde ho hledat, co zmizí, co zůstane a proč.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.deletion" });

  return {
    title: `${t("title")} — AlmostThere`,
    description: t("intro"),
    alternates: localeAlternates(locale, "/delete-account"),
  };
}

export default async function DeleteAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Content />;
}

function Content() {
  const t = useTranslations("legal.deletion");

  const steps = t.raw("steps") as string[];
  const deleted = t.raw("deleted") as string[];
  const kept = t.raw("kept") as string[];

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="display text-3xl sm:text-4xl">{t("title")}</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("intro")}
      </p>

      <h2 className="display mt-12 text-xl">{t("stepsTitle")}</h2>
      <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
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

      <h2 className="display mt-12 text-xl">{t("deletedTitle")}</h2>
      <ul className="mt-4 space-y-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {deleted.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden="true">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* Co zůstává, se říct musí. Slib „smažeme všechno“, který neplatí
          doslova, je horší než přiznaná výjimka i s důvodem. */}
      <h2 className="display mt-12 text-xl">{t("keptTitle")}</h2>
      <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {kept.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden="true">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="display mt-12 text-xl">{t("subscriptionTitle")}</h2>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("subscriptionBody")}
      </p>

      <h2 className="display mt-12 text-xl">{t("helpTitle")}</h2>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("helpBody", { email: CONTACT_EMAIL })}
      </p>

      <Link
        href="/"
        className="mt-14 inline-block text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
      >
        ← {t("back")}
      </Link>
    </section>
  );
}
