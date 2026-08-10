import { locales, type Locale } from "@/i18n/routing";
import { CONTACT_EMAIL } from "@/content/legal";
import { priceFor } from "@/lib/stripe/plans";
import { absoluteUrl, siteUrl } from "./site";

/**
 * Strukturovaná data (schema.org / JSON-LD).
 *
 * Vyhledávače i jazykové modely odpovídají na otázky typu „kolik to
 * stojí" a „co to umí". Z běžného textu si tu odpověď musí domyslet a
 * často se spletou — mimo jiné proto, že marketingová věta zní ve všech
 * jazycích jinak. Tady jsou stejné údaje zapsané strojově: cena jako
 * číslo, měna jako kód, jazyky jako seznam. Když si stroj nemá co
 * domýšlet, nevymyslí si nesmysl.
 *
 * Údaje musí souhlasit s tím, co je na stránce vidět. Rozpor mezi
 * strukturovanými daty a viditelným textem se bere jako klamání
 * a Google za něj web z výsledků vyhazuje.
 */

type Json = Record<string, unknown>;

/** Kdo za produktem stojí. Jméno, ne značka — smlouvu uzavírá člověk. */
export function organizationLd(): Json {
  return {
    "@type": "Organization",
    "@id": `${siteUrl()}/#organization`,
    name: "AlmostThere",
    url: siteUrl(),
    logo: `${siteUrl()}/icon.svg`,
    founder: { "@type": "Person", name: "Dagmar Drbálková" },
    email: CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: "V Jezírku 544",
      postalCode: "252 43",
      addressLocality: "Průhonice",
      addressCountry: "CZ",
    },
  };
}

export function webSiteLd(locale: Locale): Json {
  return {
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    url: absoluteUrl(locale),
    name: "AlmostThere",
    inLanguage: locale,
    publisher: { "@id": `${siteUrl()}/#organization` },
  };
}

/**
 * Samotný produkt.
 *
 * `offers` nese obě varianty předplatného jako čísla — právě tuhle
 * hodnotu si stroj vytáhne, když se ho někdo zeptá na cenu.
 */
export function softwareApplicationLd(
  locale: Locale,
  description: string,
  features: string[],
): Json {
  const monthly = priceFor(locale, "monthly");
  const yearly = priceFor(locale, "yearly");

  return {
    "@type": "SoftwareApplication",
    "@id": `${siteUrl()}/#app`,
    name: "AlmostThere",
    url: absoluteUrl(locale),
    description,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Productivity",
    operatingSystem: "Web, Android",
    inLanguage: [...locales],
    featureList: features,
    publisher: { "@id": `${siteUrl()}/#organization` },
    offers: [
      {
        "@type": "Offer",
        name: "monthly",
        price: monthly.value,
        priceCurrency: monthly.currency,
        url: `${absoluteUrl(locale)}#pricing`,
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "yearly",
        price: yearly.value,
        priceCurrency: yearly.currency,
        url: `${absoluteUrl(locale)}#pricing`,
        availability: "https://schema.org/InStock",
      },
    ],
  };
}

/**
 * Otázky a odpovědi.
 *
 * Tohle je z celého souboru nejužitečnější kus: modely odpovídají tak,
 * že hledají hotovou odpověď na položenou otázku. Když ji na webu najdou
 * doslova, ocitují ji. Když ne, poskládají si ji z marketingových vět —
 * a tam vznikají ty nejisté výsledky.
 */
export function faqLd(items: { q: string; a: string }[]): Json {
  return {
    "@type": "FAQPage",
    "@id": `${siteUrl()}/#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** Zabalí jednotlivé kusy do jednoho grafu — méně skriptů na stránce. */
export function graph(...nodes: Json[]): Json {
  return { "@context": "https://schema.org", "@graph": nodes };
}
