import type { Metadata } from "next";
import { locales, defaultLocale } from "@/i18n/routing";
import { absoluteUrl } from "./site";

/**
 * Odkazy mezi jazykovými verzemi stránky.
 *
 * Stejný obsah máme ve třech jazycích na třech adresách. Bez tohohle je
 * vyhledávač i model, který web čte, vidí jako tři soupeřící kopie
 * a nemá jak poznat, která patří komu — část z nich pak nezaindexuje
 * vůbec. `canonical` říká „tohle je originál téhle stránky",
 * `languages` říká „a tady jsou její sourozenci v jiných jazycích".
 *
 * `x-default` je varianta pro návštěvníka, jehož jazyk nemáme; míří na
 * výchozí jazyk aplikace.
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
      "x-default": absoluteUrl(defaultLocale, path),
    },
  };
}
