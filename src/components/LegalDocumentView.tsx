import { useTranslations } from "next-intl";
import type { LegalDocument } from "@/content/legal";

/** Společné vykreslení obchodních podmínek i zásad ochrany údajů. */
export function LegalDocumentView({
  title,
  document,
  locale,
}: {
  title: string;
  document: LegalDocument;
  locale: string;
}) {
  const t = useTranslations("legal");

  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${document.lastUpdated}T00:00:00Z`));

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="display text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-[var(--color-paper-faint)]">
        {t("lastUpdated")}: {formattedDate}
      </p>

      <p className="mt-8 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {document.intro}
      </p>

      <div className="mt-10 space-y-10">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="display text-xl">{section.heading}</h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-[15px] leading-relaxed text-[var(--color-paper-dim)]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
