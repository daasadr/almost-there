import type { Locale } from "@/i18n/routing";

/**
 * Články.
 *
 * Stejně jako návod a právní texty žijí tady, ne mezi UI stringy —
 * do prohlížeče se posílat nemají a vykreslují se na serveru.
 *
 * Proč takhle a ne v Markdownu: článek tu není volný text, ale posloupnost
 * pojmenovaných prvků. Díky tomu má odstavec, mezititulek i citace svůj
 * vzhled daný jednou pro celý web a nejde je omylem naformátovat jinak.
 * Zároveň odpadá závislost navíc a překlep v zápisu chytne překladač,
 * ne až čtenář.
 *
 * KAŽDÝ ČLÁNEK STOJÍ SÁM O SOBĚ V JEDNOM JAZYCE. Překlad není povinný;
 * co v daném jazyce není, se v něm ani nenabízí a nehlásí vyhledávačům.
 * Radši tři dobré české články než devět strojově přeložených.
 */

export type ArticleBlock =
  /** Odstavec. */
  | { kind: "p"; text: string }
  /** Mezititulek uvnitř článku. */
  | { kind: "h2"; text: string }
  /** Vytažená myšlenka. Nepoužívat víc než jednou dvakrát za článek. */
  | { kind: "quote"; text: string }
  /** Odrážky. */
  | { kind: "list"; items: string[] };

export type Article = {
  /** Část adresy. Malá písmena, pomlčky, bez diakritiky. */
  slug: string;
  locale: Locale;
  title: string;
  /** Jedna věta do výpisu a do náhledu při sdílení. */
  excerpt: string;
  /** YYYY-MM-DD. Podle něj se řadí a ukazuje se u článku. */
  publishedAt: string;
  blocks: ArticleBlock[];
};

/**
 * Nový článek se přidá sem. Pořadí v poli nerozhoduje, řadí se datem.
 *
 * Zatím je tu jeden a je to ukázka — přepiš ho svým textem, nebo ho
 * smaž. Slouží k tomu, aby bylo vidět, jak má článek vypadat, dokud
 * nebudou hotové tvoje.
 */
export const articles: Article[] = [
  {
    slug: "kolik-casu-zabere-naplanovat-rok",
    locale: "cs",
    title: "Kolik času doopravdy zabere naplánovat si rok",
    excerpt:
      "Zkoušela jsem to perem na papíře. Trvalo to déle, než jsem čekala, a nejtěžší část přišla až úplně nakonec.",
    publishedAt: "2026-09-14",
    blocks: [
      {
        kind: "p",
        text: "Většina rad o cílech končí u věty, že si je má člověk rozdělit na menší kroky. Nikdo ale neřekne, kolik času to zabere — a to je přesně ten důvod, proč to většina lidí nikdy neudělá.",
      },
      {
        kind: "p",
        text: "Tak jsem si to změřila. Vzala jsem si papír, pero a jeden skutečný cíl s termínem za rok.",
      },
      { kind: "h2", text: "První dvě hodiny: měsíce a týdny" },
      {
        kind: "p",
        text: "Rozdělit rok na měsíční etapy vypadá jako lehká část. Není. Pokaždé, když jsem napsala, co má být hotové na konci dubna, musela jsem se vrátit k březnu a zkontrolovat, jestli to vůbec navazuje. A když jsem opravila březen, rozsypal se květen.",
      },
      {
        kind: "quote",
        text: "Plán není seznam. Je to soustava, kde každá změna hýbe vším ostatním.",
      },
      {
        kind: "p",
        text: "Po dvou hodinách jsem měla dvanáct měsíčních etap a hrubé rozdělení do týdnů. A pocit, že mám hotovo.",
      },
      { kind: "h2", text: "Další dvě hodiny, na které nedojde" },
      {
        kind: "p",
        text: "Jenže týdenní cíl se nedá splnit. Splnit se dá jen to, co má člověk udělat dnes. A přeložit padesát dva týdnů na konkrétní denní úkoly je práce, u které mi došlo, proč to nikdo nedělá.",
      },
      {
        kind: "list",
        items: [
          "Kolik času na to reálně mám v úterý, když mám i práci?",
          "Kdy si nechám volno, aby to nebylo až ve chvíli, kdy už nemůžu?",
          "Co když týden vypadnu — přesune se všechno, nebo jen část?",
        ],
      },
      {
        kind: "p",
        text: "Tady jsem skončila. Ne proto, že by to nešlo, ale protože to byly další dvě hodiny práce, do které se mi po těch prvních dvou už nechtělo. Zůstal mi plán rozdělený na týdny — tedy přesně ten plán, podle kterého se nedá začít.",
      },
      { kind: "h2", text: "Proč to vůbec píšu" },
      {
        kind: "p",
        text: "Protože tohle je ta bariéra. Ne lenost a ne nedostatek vůle. Čtyři hodiny soustředěné práce dřív, než se udělá první skutečný krok — a bez jistoty, že to bude k něčemu dobré.",
      },
      {
        kind: "p",
        text: "AlmostThere vzniklo z toho odpoledne. Ne proto, že by plánování bylo nezajímavé, ale protože je to práce, kterou stroj zvládne za minutu a člověk ji za ty čtyři hodiny udělá hůř. Nám zbyde ta část, kterou za nás nikdo neudělá: jít a odškrtnout si dnešek.",
      },
    ],
  },
];

/** Články v daném jazyce, od nejnovějšího. */
export function articlesFor(locale: Locale): Article[] {
  return articles
    .filter((article) => article.locale === locale)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function findArticle(locale: Locale, slug: string): Article | undefined {
  return articles.find(
    (article) => article.locale === locale && article.slug === slug,
  );
}

/**
 * Odhad doby čtení v minutách.
 *
 * Počítá se ze slov, ne ze znaků — čeština má delší slova než angličtina
 * a podle znaků by jí vycházelo delší čtení při stejném obsahu. Dvě stě
 * slov za minutu je střízlivý odhad pro souvislý text.
 */
export function readingMinutes(article: Article): number {
  const words = article.blocks.reduce((total, block) => {
    const text =
      block.kind === "list" ? block.items.join(" ") : block.text;
    return total + text.split(/\s+/).length;
  }, 0);

  return Math.max(1, Math.round(words / 200));
}
