import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <section className="grid min-h-[70dvh] place-items-center px-5">
      <div className="max-w-md text-center">
        <h1 className="display text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-[var(--color-paper-dim)]">{t("body")}</p>
        <Link href="/" className="btn-primary mt-8">
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
