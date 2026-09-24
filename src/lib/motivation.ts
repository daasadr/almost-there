/**
 * Výběr myšlenky na den a příprava textu k předčítání.
 *
 * Schválně bez `server-only` a bez sáhnutí do databáze: totéž potřebuje
 * server při rozesílání oznámení i prohlížeč, který text předčítá.
 */

/**
 * Kolikátý text dnes patří uživateli.
 *
 * Řadí se podle toho, kolikátý den ten člověk aplikaci má, ne podle
 * kalendáře. Kdo se přidá v březnu, začíná jedničkou — jinak by mu prvních
 * pár týdnů chodily texty vytržené z řady a knihovna by musela být hotová
 * dřív, než přijde první uživatel.
 *
 * Po vyčerpání knihovny se začíná znovu od jedničky. Opakování je lepší
 * než ticho a u textů, které na sebe nenavazují, si toho po půl roce
 * skoro nikdo nevšimne.
 *
 * Vrací číslo od 1 do `count`, nebo 0, když knihovna je prázdná.
 */
export function pieceNumberForDay(
  startedAt: Date,
  today: Date,
  count: number,
): number {
  if (count <= 0) return 0;

  const days = Math.floor(
    (startOfDay(today).getTime() - startOfDay(startedAt).getTime()) / 86_400_000,
  );

  // Kdo má datum začátku v budoucnosti (přesunutý čas, ruční zásah),
  // dostane první text. Záporný zbytek by jinak spadl mimo pole.
  const index = days <= 0 ? 0 : days % count;

  return index + 1;
}

/** Půlnoc — ať se den počítá podle dne, ne podle hodiny registrace. */
function startOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Které oslovení použít.
 *
 * Nadpis oznámení se obměňuje, aby to po třech týdnech nebyla tapeta,
 * kterou oko přeskočí. Střídá se podle dne, ne náhodně — náhoda by
 * znamenala, že dvakrát po sobě přijde totéž, a to vypadá jako chyba.
 */
export function labelIndexForDay(day: number, labelCount: number): number {
  if (labelCount <= 0) return 0;
  return ((day % labelCount) + labelCount) % labelCount;
}

/**
 * Rozsekání textu na věty.
 *
 * Předčítání v prohlížeči neumí skočit doprostřed — umí jen spustit
 * a zastavit. Když se ale text čte po větách, dá se zvýrazňovat ta právě
 * čtená a kliknutím na kteroukoliv začít od ní. Z počtu přečtených vět
 * pak vyjde i ukazatel postupu.
 *
 * Kromě toho to obchází chybu Chromu, který delší promluvu utne zhruba
 * po patnácti vteřinách. Jedno řešení tedy pokrývá obojí.
 *
 * Tečka větu nekončí vždycky: „14. dne“ ani „např. takhle“ nejsou dvě
 * věty. Proto se kousek přilepí zpátky, když začíná malým písmenem nebo
 * když před tečkou stojí číslice.
 */
export function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?…])\s+/);
  const out: string[] = [];

  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;

    const previous = out[out.length - 1];
    const continuation =
      previous !== undefined &&
      (/^\p{Ll}/u.test(part) || !endsSentence(previous));

    if (continuation) {
      out[out.length - 1] = `${previous} ${part}`;
    } else {
      out.push(part);
    }
  }

  return out;
}

/** Končí tenhle kousek opravdu větou? */
function endsSentence(part: string): boolean {
  // Řadová číslovka — „ve 14. dne“, „1. ledna“.
  if (/\d[.]$/.test(part)) return false;

  // Obvyklé zkratky ve všech třech jazycích.
  if (
    /(^|\s)(např|atd|apod|tzv|tzn|tj|mj|resp|cca|str|sv|č|z\.\s?B|bzw|usw|vgl|ca|e\.\s?g|i\.\s?e)\.$/iu.test(
      part,
    )
  ) {
    return false;
  }

  return /[.!?…]["»“”'’]?$/u.test(part);
}

/**
 * Kratší odstavec než tohle je oslovení nebo podpis, ne obsah.
 *
 * Číslo je od oka, ale rozdíl je velký: „Ahoj, ty na cestě za svými
 * cíli," má kolem třiceti znaků, první skutečná věta textu vždycky
 * podstatně víc.
 */
const GREETING_MAX_CHARS = 60;

/**
 * Upoutávka do oznámení a na kartičku — první věta textu.
 *
 * Oznámení unese jen pár řádků a kartička na dnešku taky ne víc; zbytek
 * se otevře až na vyžádání. Proto musí první věta dávat smysl i vytržená.
 *
 * Oslovení se přeskakuje. Texty začínají pozdravem a ten jako upoutávka
 * nefunguje — na zamčené obrazovce by stálo jen „Ahoj," a nikdo by se
 * nedozvěděl, o čem to dnes je.
 */
export function teaser(paragraphs: string[]): string {
  const body =
    paragraphs.find(
      (paragraph) => paragraph.trim().length > GREETING_MAX_CHARS,
    ) ??
    paragraphs[0] ??
    "";

  return splitSentences(body)[0] ?? body;
}
