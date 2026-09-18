/**
 * Motivy vzhledu.
 *
 * Aplikace byla od začátku tmavá a pro část lidí je to překážka: špatně
 * se na tom soustředí, hůř se to čte a než se s tím sžijí, odejdou.
 * Vzhled je přitom to jediné, co člověk vidí dřív, než pochopí, k čemu
 * je to dobré — takže tady se rozhoduje, jestli zůstane.
 *
 * Zvolit si ho tedy může sám. Celá aplikace kreslí z barevných tokenů,
 * takže motiv je jen jejich přepsání — definice jsou v globals.css
 * a žádná komponenta o motivech neví.
 *
 * Tenhle soubor schválně nemá `import "server-only"`: volba se čte
 * v prohlížeči i v krátkém skriptu, který ji nastaví ještě před
 * vykreslením.
 */

export const THEMES = [
  "classic",
  "steampunk",
  "sweet-pink",
  "sweet-blue",
  "jungle",
  "minimalist",
] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "classic";

/** Klíč v úložišti prohlížeče. Musí sedět se skriptem v hlavičce. */
export const THEME_STORAGE_KEY = "almostthere:theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * Skript, který motiv nastaví ještě před vykreslením stránky.
 *
 * Bez něj by se při každém načtení na okamžik ukázal Classic a teprve
 * pak by přeskočil na zvolený motiv. To probliknutí je u tmavého
 * výchozího motivu obzvlášť nepříjemné — kdo si vybral světlý, dostane
 * přes oči každou stránku.
 *
 * Proto běží synchronně v hlavičce, ne až po hydrataci. Je krátký
 * schválně; všechno ostatní počká.
 *
 * Celý je v `try`, protože `localStorage` umí vyhodit výjimku i za pouhé
 * čtení — Firefox s přísnou ochranou proti sledování, zakázané cookies.
 * Výjimka tady by zastavila vykreslování celé stránky.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t&&${JSON.stringify(
  THEMES as readonly string[],
)}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`;
