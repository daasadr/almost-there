/**
 * Kam se smí uživatel po přihlášení vrátit.
 *
 * `callbackUrl` přichází z adresního řádku, takže si ho útočník může
 * zvolit. Kdyby se použil, jak přijde, dal by se jím člověk po
 * přihlášení poslat na cizí web — a ten by mohl vypadat jako náš
 * a požádat ho o heslo znovu. Tomu se říká otevřené přesměrování
 * a je to jedna z mála chyb, kterou útočník zneužije bez přístupu
 * kamkoliv.
 *
 * ── Proč se neporovnává začátek řetězce ─────────────────────────────
 *
 * Nabízí se podmínka „začíná lomítkem a ne dvěma". Vypadá správně
 * a není: `/\evil.com` jí projde, protože začíná jedním lomítkem —
 * jenže prohlížeč zpětné lomítko v adrese překládá na obyčejné, takže
 * tu adresu přečte jako `//evil.com` a odejde na cizí doménu. Stejně
 * tak projdou řídicí znaky, které parser zahodí a slepí, co zbude.
 *
 * Proto se adresa rozebere stejným parserem, jaký použije prohlížeč,
 * a ptáme se jen na jedno: vyšla z toho pořád naše doména? Co projde
 * tímhle, projde i prohlížeči — protože to je tentýž výpočet.
 */

/** Doména, proti které se měří. Nikam se neposílá, jen se porovnává. */
const BASE = "https://relative.invalid";

export function safeRedirect(
  requested: string | undefined | null,
  fallback: string,
): string {
  if (!requested) return fallback;

  try {
    const url = new URL(requested, BASE);

    // Cokoliv, co se rozbalí na jinou doménu nebo jiné schéma
    // (`javascript:`, `//cizi.cz`, `/\cizi.cz`), tady skončí.
    if (url.origin !== BASE) return fallback;

    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
