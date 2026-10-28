/**
 * Meze hlášení — sdílené mezi serverem a formulářem.
 *
 * Vlastní soubor proto, že `submit.ts` je `server-only` a komponenta
 * v prohlížeči z něj nesmí importovat nic. Kdyby si čísla opsala
 * k sobě, rozejdou se při první změně a uživatel dostane od serveru
 * odmítnutí, které mu formulář slíbil přijmout.
 */

/** Kratší text není hlášení, delší se do formuláře stejně nevejde. */
export const MIN_LENGTH = 10;
export const MAX_LENGTH = 4000;

/** Kolik hlášení za hodinu z jednoho účtu. */
export const PER_HOUR = 5;
