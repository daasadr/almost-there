import { useTranslations } from "next-intl";

/**
 * Otázky a odpovědi.
 *
 * Kromě toho, že to lidem ušetří psaní na podporu, je to jediné místo na
 * webu, kde stojí odpověď na položenou otázku doslova. Vyhledávače
 * i jazykové modely odpovídají tak, že hledají hotovou větu — když ji
 * nenajdou, poskládají si ji z reklamních sloganů a výsledek bývá vedle.
 *
 * Proto jsou tady odpovědi rozepsané v textu stránky, ne schované
 * v rozklikávacím prvku, který se dotahuje až po kliknutí. Ke každé
 * otázce jsou navíc strukturovaná data — viz lib/seo/jsonLd.ts.
 */
export function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center reveal">
          <p className="eyebrow justify-center">04</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-[var(--color-paper-dim)]">
            {t("subtitle")}
          </p>
        </div>

        {/* Seznam popisů: otázka je termín, odpověď jeho vysvětlení.
            Odečítátko obrazovky pak dvojici přečte jako dvojici. */}
        <dl className="mx-auto mt-14 max-w-3xl divide-y divide-white/5 border-y border-white/5">
          {items.map((item) => (
            <div key={item.q} className="reveal py-7">
              <dt className="text-[17px] font-semibold text-[var(--color-paper)]">
                {item.q}
              </dt>
              <dd className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
