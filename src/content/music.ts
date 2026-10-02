/**
 * Motivační hudba.
 *
 * Skladby vznikly k příspěvkům na sociálních sítích a byla by škoda
 * nechat je tam ležet. Patří k ranní myšlence: obojí je doprovod dne,
 * ne úkol.
 *
 * ── Kde leží soubory ────────────────────────────────────────────────
 *
 * V `public/music/`. Je to nejjednodušší cesta a u pár skladeb správná.
 * Má ale jeden háček, který se nedá vzít zpět: soubory jdou do gitu
 * a jeho historie se nikdy nezmenšuje. I kdyby se později přesunuly
 * jinam, zůstanou v ní navždy a každý build je bude kopírovat.
 *
 * **Hranice je kolem padesáti megabajtů, tedy zhruba patnáct skladeb.**
 * Až se k ní seznam přiblíží, přesunou se do složky na serveru mimo
 * repozitář — a ještě se tím získá to, že přidání skladby nebude
 * znamenat nasazení.
 *
 * ── Jak přidat skladbu ──────────────────────────────────────────────
 *
 * Soubor do `public/music/`, položka sem. `file` je název souboru
 * včetně přípony, nic víc.
 *
 * Nadpis a popis nejsou překládané. U hudby to nevadí — název skladby
 * je název skladby — a vyhne se tím tomu, že by tři jazyky říkaly
 * o jedné písničce tři různé věci.
 */

export type Track = {
  /** Soubor v `public/music/`, včetně přípony. */
  file: string;
  title: string;
  /** K čemu se hodí. Jedna věta, klidně i prázdná. */
  note?: string;
};

export const tracks: Track[] = [
  // POZOR: názvy jsou odvozené od souborů a je potřeba je přepsat na
  // skutečné. Je to první věc, kterou u skladby člověk uvidí.
  { file: "winner.mp3", title: "Winner" },
  { file: "secret.mp3", title: "Secret" },
];
