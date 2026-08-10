import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site";

/**
 * Roboti, kteří web čtou.
 *
 * Kromě vyhledávačů sem dnes chodí i roboti jazykových modelů a stojí za
 * to je rozlišit, protože dělají dvě různé věci:
 *
 *  - *odpovídací* (OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot)
 *    přijdou ve chvíli, kdy se někdo na něco zeptá, a z webu složí
 *    odpověď i s odkazem. Tyhle chceme — je to přesně ta cesta, kterou
 *    nás dnes lidé najdou.
 *
 *  - *trénovací* (GPTBot, CCBot, Google-Extended, Applebot-Extended)
 *    sbírají text pro učení budoucích modelů. Návštěvu dnes nepřinesou,
 *    ale znalost produktu se dostane do modelů, které lidé používají bez
 *    hledání. U veřejné marketingové stránky na tom není co ztratit,
 *    a proto je taky pouštíme dál.
 *
 * Kdyby se to mělo změnit, stačí příslušnému robotovi přepsat `allow` na
 * `disallow`. Roboti to ale dodržují dobrovolně — kdo pravidla ignoruje,
 * toho nezastaví ani tohle.
 */

/** Roboti odpovídající na dotazy uživatelů. */
const ANSWER_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
];

/** Roboti sbírající text pro učení modelů. */
const TRAINING_BOTS = [
  "GPTBot",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
];

/**
 * Adresy, které nikdo z nich indexovat nemá.
 *
 * `/api/` je rozhraní, ne stránky. Zbytek je za přihlášením a robot se
 * tam stejně nedostane — ale kdyby se adresa objevila v odkazu, nemá
 * důvod ji zkoušet.
 */
const PRIVATE = ["/api/", "/*/app", "/*/admin"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...ANSWER_BOTS.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: PRIVATE,
      })),
      ...TRAINING_BOTS.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: PRIVATE,
      })),
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
