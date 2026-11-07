/**
 * Všechna čísla navádění na jednom místě.
 *
 * Schválně bez jediného `if`. Ladění prahů je pak jedna změna na
 * jednom místě, ne hledání po projektu — a hlavně je na jeden pohled
 * vidět, jak je to celé agresivní. Kdyby se čísla rozlezla do logiky,
 * nikdo by už nedokázal říct, kolikrát za návštěvu se ozveme.
 */

/**
 * Kam se smí ukázat.
 *
 * Jména, ne adresy: do události o navádění se pak nemůže dostat nic
 * z obsahu stránky, protože se posílá tohle slovo a ne cesta.
 */
export const TARGETS = ["demo", "templates", "pdfPlans", "guide"] as const;

export type Target = (typeof TARGETS)[number];

/**
 * Kam se nenaviguje nikdy.
 *
 * Rozdíl mezi službou a temným vzorcem není v tom, jak nápověda
 * vypadá, ale kam ukazuje. Dokončit něco, co člověk sám začal, je
 * pomoc; pobízet ke koupi někoho, kdo si jen čte, je nátlak.
 *
 * Totéž je slovy v zásadách soukromí a test obojí porovnává — tvrzení
 * a kód se jinak rozejdou tiše.
 */
export const FORBIDDEN_TARGETS = [
  "subscribe",
  "checkout",
  "buy",
  "upgrade",
] as const;

/** Po příchodu se mlčí. Rada v první vteřině je skok do řeči. */
export const ARRIVAL_MS = 6_000;

/**
 * Ticho, které se počítá za váhání.
 *
 * Musí mu předcházet pohyb — ticho samo o sobě znamená jen to, že si
 * člověk odskočil pro kafe.
 */
export const SILENCE_MS = 9_000;

/** Kolik přejezdů nad klikacím prvkem bez klepnutí je váhání. */
export const HOVER_THRESHOLD = 3;

/** Jak daleko od konce stránky se bere, že doroloval. Podíl výšky. */
export const SCROLL_END_RATIO = 0.9;

/** Nejvýš tolik nápověd za návštěvu. Čtvrtá je otravování. */
export const MAX_HINTS = 3;

/** Klid mezi nápovědami. */
export const COOLDOWN_MS = 45_000;

/** Jak dlouho je nápověda vidět, než sama zhasne. */
export const HINT_MS = 6_000;

/**
 * Do kolika vteřin po nápovědě se klepnutí na cíl počítá za to, že
 * pomohla. Delší okno by připisovalo zásluhy náhodě.
 */
export const CREDIT_MS = 8_000;

/** Co nápovědu spustilo. Jde do události, proto pevný seznam. */
export const REASONS = ["silence", "scrollEnd", "hover"] as const;

export type Reason = (typeof REASONS)[number];
