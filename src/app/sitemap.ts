import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { LEGAL_VERSION } from "@/content/legal";
import { articlesFor } from "@/content/articles";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * Mapa veřejných stránek.
 *
 * Ke každé adrese jsou uvedené i její jazykové varianty. Bez toho by
 * vyhledávač tři jazykové verze bral jako tři soupeřící stránky a část
 * z nich by nezaindexoval.
 *
 * Datum poslední změny se u právních dokumentů bere z jejich verze, ne
 * z času buildu. Kdyby se u všech stránek uvádělo „změněno právě teď",
 * přestane ten údaj po pár nasazeních kdokoliv brát vážně.
 */
const PAGES = [
  { path: "", priority: 1 },
  { path: "/demo", priority: 0.8 },
  { path: "/guide", priority: 0.7 },
  { path: "/terms", priority: 0.3, lastModified: LEGAL_VERSION },
  { path: "/privacy", priority: 0.3, lastModified: LEGAL_VERSION },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const buildTime = new Date();

  return [...pageEntries(buildTime), ...blogEntries(buildTime)];
}

function pageEntries(buildTime: Date): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    PAGES.map((page) => ({
      url: absoluteUrl(locale, page.path),
      lastModified:
        "lastModified" in page ? new Date(page.lastModified) : buildTime,
      changeFrequency: "monthly" as const,
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((code) => [code, absoluteUrl(code, page.path)]),
        ),
      },
    })),
  );
}

/**
 * Články do mapy zvlášť.
 *
 * Nedají se přidat k `PAGES` výš, protože ty mají všechny jazykové
 * varianty. Článek existuje jen v jazyce, ve kterém byl napsaný —
 * uvést u něj sourozence, kteří nikde nejsou, by vyhledávače poslalo
 * na chybějící stránky.
 *
 * Výpis se uvádí jen tehdy, když v daném jazyce nějaký článek je.
 * Prázdná stránka v mapě je slib, který nikdo nesplní.
 */
function blogEntries(buildTime: Date): MetadataRoute.Sitemap {
  return locales.flatMap((locale) => {
    const items = articlesFor(locale);
    if (items.length === 0) return [];

    return [
      {
        url: absoluteUrl(locale, "/blog"),
        lastModified: new Date(items[0].publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      ...items.map((article) => ({
        url: absoluteUrl(locale, `/blog/${article.slug}`),
        lastModified: new Date(article.publishedAt),
        changeFrequency: "yearly" as const,
        priority: 0.5,
      })),
    ];
  });
}
