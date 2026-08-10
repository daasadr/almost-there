/**
 * Rozpoznání aplikace z obchodu.
 *
 * Google Play zakazuje, aby aplikace stažená z obchodu nabízela placení
 * mimo obchod — a naše placení běží přes Stripe na webu. Aplikace se
 * proto v hlavičce prohlížeče hlásí vlastním podpisem (nastavuje ho
 * `appendUserAgent` v capacitor.config.ts) a podle něj se v ní všechno,
 * co vede k placení, schová.
 *
 * Ve webovém prohlížeči se nic nemění: tam se platí normálně.
 *
 * Tenhle soubor schválně nemá `import "server-only"` — podpis se čte
 * jednou na serveru (u stránek za přihlášením, které stejně nejdou
 * předgenerovat) a jednou na klientovi (na úvodní stránce, která
 * předgenerovaná je a hlavičku požadavku by se ptát nemohla, aniž by
 * o to přišla).
 */

/** Musí přesně sedět s `appendUserAgent` v capacitor.config.ts. */
export const STORE_APP_MARKER = "AlmostThereApp";

/** Na serveru: z hlaviček požadavku. */
export function isStoreApp(headers: Headers): boolean {
  return headers.get("user-agent")?.includes(STORE_APP_MARKER) ?? false;
}

/** Na klientovi: z prohlížeče. Při vykreslení na serveru vrací `false`. */
export function isStoreAppClient(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.userAgent.includes(STORE_APP_MARKER);
}
