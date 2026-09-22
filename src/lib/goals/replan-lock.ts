import "server-only";
import { db } from "@/lib/db";

/**
 * Zámek na dobu přeplánování cíle.
 *
 * Přeplánování si na začátku přečte, jak cíli jde tempo, pak si několik
 * minut povídá s modelem a nakonec smaže celý plán ode dneška dál a
 * napíše nový. Mezi tím prvním a posledním krokem byla díra: uživatel
 * mohl klidně dál odškrtávat úkoly. Dělo se pak tohle —
 *
 *   1. přečte se „tři dny se nedodělaly“
 *   2. uživatel ty tři dny doklikne
 *   3. model dostane zadání s trojkou a napíše zdůvodnění o skluzu
 *   4. zdůvodnění se uloží a zobrazuje napořád
 *
 * a uživatel od té chvíle kouká na hlášku o nesplněných dnech, které má
 * před sebou odškrtané. Navíc mu zmizela zaškrtnutí na dnešek, protože
 * ta poslední úklidová věta bere i dnešní blok.
 *
 * Zámek to řeší tím, že po dobu přeplánování odmítne změny plnění. Je to
 * nepříjemné, ale kratší a srozumitelné — na rozdíl od plánu, který
 * tvrdí něco jiného než realita.
 */

/**
 * Po jaké době se zámek považuje za opuštěný.
 *
 * Kdyby proces mezi zamčením a odemčením spadl, zůstal by cíl zamčený
 * navždy a uživatel by si už nikdy nic neodškrtl. Musí se tedy dát
 * přebít — a hranice je o kus dál než nejdelší možné přeplánování
 * (`maxDuration` je pět minut), ať se nepřebíjí něco, co ještě běží.
 */
const STALE_AFTER_MINUTES = 10;

/** Cíl se právě přeplánovává, teď do něj nesahej. */
export class ReplanInProgressError extends Error {
  readonly name = "ReplanInProgressError";
}

/**
 * Zamkne cíl, pokud není zamčený.
 *
 * Podmínka je součástí `UPDATE`, takže o vítězi rozhodne databáze. Dvě
 * souběžná přeplánování téhož cíle se tím vylučují sama — kdyby se
 * nejdřív četlo a pak zapisovalo, prošla by obě.
 */
export async function acquireReplanLock(goalId: string): Promise<boolean> {
  const stale = new Date(Date.now() - STALE_AFTER_MINUTES * 60_000);

  const { count } = await db.goal.updateMany({
    where: {
      id: goalId,
      OR: [{ replanningAt: null }, { replanningAt: { lt: stale } }],
    },
    data: { replanningAt: new Date() },
  });

  return count === 1;
}

/** Odemkne cíl. Patří do `finally` — i spadlé přeplánování musí uklidit. */
export async function releaseReplanLock(goalId: string): Promise<void> {
  await db.goal.updateMany({
    where: { id: goalId },
    data: { replanningAt: null },
  });
}

/**
 * Běží na cíli právě přeplánování?
 *
 * Opuštěný zámek se nepočítá — jinak by pád při přeplánování uživateli
 * zablokoval odškrtávání a on by neměl jak se z toho dostat.
 */
export function isReplanning(replanningAt: Date | null): boolean {
  if (!replanningAt) return false;
  return replanningAt.getTime() > Date.now() - STALE_AFTER_MINUTES * 60_000;
}
