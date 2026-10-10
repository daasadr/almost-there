import type { Metadata } from "next";
import { locales } from "@/i18n/routing";
import { absoluteUrl, siteUrl } from "./site";

/**
 * Odkazy mezi jazykovými verzemi stránky.
 *
 * Stejný obsah máme ve třech jazycích na třech adresách. Bez tohohle je
 * vyhledávač i model, který web čte, vidí jako tři soupeřící kopie
 * a nemá jak poznat, která patří komu — část z nich pak nezaindexuje
 * vůbec. `canonical` říká „tohle je originál téhle stránky",
 * `languages` říká „a tady jsou její sourozenci v jiných jazycích".
 *
 * `x-default` je varianta pro návštěvníka, jehož jazyk nemáme. Míří na
 * adresu bez jazyka, která podle nastavení prohlížeče sama přesměruje —
 * a hlavně na tu samou adresu, jakou uvádí hlavička `Link`, kterou
 * přidává next-intl. Dvě různé odpovědi na tutéž otázku by si
 * odporovaly a vyhledávač by nevěřil ani jedné.
 *
 * @param path cesta bez jazyka, tedy "" pro úvodní stránku nebo "/demo"
 */
export function localeAlternates(
  locale: string,
  path = "",
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: absoluteUrl(locale, path),
    languages: {
      ...Object.fromEntries(
        locales.map((code) => [code, absoluteUrl(code, path)]),
      ),
      "x-default": `${siteUrl()}${path || "/"}`,
    },
  };
}

/**
 * Náhled odkazu pro jednotlivou stránku.
 *
 * Next.js metadata **neslučuje do hloubky**: jakmile stránka uvede
 * vlastní `openGraph`, ten z layoutu se celý zahodí. Zní to jako
 * detail, ale prakticky to znamená, že stránka, která si chtěla jen
 * přepsat obrázek, tiše přijde i o `og:url`, `og:site_name`
 * a `og:locale` — a nikde to nespadne.
 *
 * Nejvíc na tom záleží WhatsApp: ten si podle `og:url` ověřuje, že
 * odkaz k té stránce patří, a bez něj náhled klidně zahodí celý. Takhle
 * přišly o obrázek stránky šablon i všechny články na blogu.
 *
 * Proto to má vlastní funkci. Kdo potřebuje jiný obrázek, projde tudy
 * a zbytek dostane s sebou, ať na něj nemusí myslet.
 */
export function pageSocial({
  locale,
  path,
  title,
  description,
  image,
  type = "website",
  publishedTime,
}: {
  locale: string;
  /** Cesta bez jazyka, tedy "/templates/marathon". */
  path: string;
  title: string;
  description: string;
  /** Obrázek v `public/`, třeba "/og-template-marathon-cs.png". */
  image: string;
  type?: "website" | "article";
  publishedTime?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type,
      title,
      description,
      url: absoluteUrl(locale, path),
      siteName: "AlmostThere",
      locale,
      ...(publishedTime ? { publishedTime } : {}),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
