/**
 * Adresa webu na jednom místě.
 *
 * Strukturovaná data a odkazy mezi jazyky musí být absolutní — vyhledávač
 * i jazykový model je čte mimo kontext stránky a relativní adresa jim
 * neřekne nic. Ořezané lomítko na konci je tu proto, aby ze spojování
 * nevznikaly adresy s dvojitým lomítkem, které se pak počítají jako jiná
 * stránka.
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

/** Absolutní adresa cesty v daném jazyce. */
export function absoluteUrl(locale: string, path = ""): string {
  return `${siteUrl()}/${locale}${path}`;
}
