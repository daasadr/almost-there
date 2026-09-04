/**
 * Úložiště prohlížeče, které nespadne.
 *
 * `localStorage` není vždycky k dispozici. Firefox s přísnou ochranou
 * proti sledování, Safari v soukromém okně a každý prohlížeč s vypnutými
 * cookies na první sáhnutí vyhodí SecurityError — a to i za pouhé čtení,
 * ještě než se stihne cokoliv uložit.
 *
 * Bez pojistky je to nepříjemné: výjimka z obsluhy kliknutí zabije celý
 * React strom a uživatel má stránku, která vypadá v pořádku, ale žádné
 * tlačítko na ní nereaguje. Chyba se navíc projeví jen u části lidí,
 * takže se na ni těžko přichází.
 *
 * Nic z toho, co si tu ukládáme, není pro chod aplikace nutné — je to
 * skrytá lišta, rozepsaný koncept, čas připomínky. Když úložiště není,
 * chováme se, jako by v něm nic nebylo. To je horší zážitek, ne rozbitá
 * aplikace.
 */

type Store = "local" | "session";

function store(which: Store): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return which === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStored(key: string, which: Store = "local"): string | null {
  try {
    return store(which)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Vrací, jestli se zápis povedl — volajícímu to většinou může být jedno. */
export function writeStored(
  key: string,
  value: string,
  which: Store = "local",
): boolean {
  try {
    store(which)?.setItem(key, value);
    return true;
  } catch {
    // Kromě zakázaného úložiště sem spadne i plná kvóta.
    return false;
  }
}

export function removeStored(key: string, which: Store = "local"): void {
  try {
    store(which)?.removeItem(key);
  } catch {
    // Když nejde smazat, nejde ani číst. Není co řešit.
  }
}
