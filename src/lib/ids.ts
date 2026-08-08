import { randomUUID } from "node:crypto";

/**
 * Identifikátor pro záznamy, které zakládáme dřív, než je uloží databáze.
 *
 * U obrázků potřebujeme znát id ještě před zápisem — podle něj se skládá
 * jméno souboru na disku. Kdybychom čekali na databázi, museli bychom
 * soubor po uložení přejmenovat.
 */
export function createId(): string {
  return randomUUID();
}
