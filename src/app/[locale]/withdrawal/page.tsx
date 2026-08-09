import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "withdrawal" });
  return { title: `${t("title")} — AlmostThere` };
}

/**
 * Vzorový formulář pro odstoupení od smlouvy.
 *
 * Zákon vyžaduje, aby ho podnikatel spotřebiteli poskytl, ne jen aby se
 * o právu odstoupit zmínil v podmínkách. Stránka je proto veřejná, bez
 * přihlášení, a odkazuje se na ni i z potvrzovacího e-mailu po nákupu.
 *
 * Formulář se záměrně neodesílá přes aplikaci: odstoupení je právní
 * úkon a spotřebitel musí mít doklad o tom, že ho odeslal. E-mail od
 * něj samotného je takový doklad; odeslání tlačítkem na našem webu, kde
 * si obsah držíme my, ne.
 */
export default async function WithdrawalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "withdrawal" });
  const lines = t.raw("formLines") as string[];

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="display text-3xl sm:text-4xl">{t("title")}</h1>

      <p className="mt-5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("intro")}
      </p>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("howTo")}
      </p>

      {/* Text k opsání nebo zkopírování. Předvyplněný by nebyl projev
          vůle spotřebitele, ale náš. */}
      <div className="card mt-8 p-6 sm:p-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
          {t("formTitle")}
        </h2>

        <pre className="mt-4 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-[var(--color-paper)]">
          {lines.join("\n")}
        </pre>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-[var(--color-paper-faint)]">
        {t("note")}
      </p>

      <div className="mt-10 flex flex-wrap gap-6 text-sm">
        <Link
          href="/terms"
          className="text-[var(--color-paper-dim)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
        >
          {t("terms")}
        </Link>
        <Link
          href="/"
          className="text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
        >
          {t("home")}
        </Link>
      </div>
    </section>
  );
}
