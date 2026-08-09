import "server-only";
import { db } from "@/lib/db";

/**
 * Zneplatnění přihlášení po změně hesla.
 *
 * Přihlášení nosí uživatel v podepsaném tokenu, který si server nikam
 * neukládá — proto je rychlý a proto ho taky neumí odvolat. Kdyby někdo
 * ukradl přihlášenou relaci, změna hesla by ho nevyhodila a zloděj by
 * měl přístup ještě třicet dní.
 *
 * Řeší to jedna značka času na účtu. Token si nese, kdy byl vydán;
 * když je starší než ta značka, neplatí. Změna hesla značku posune
 * a všechna dřívější přihlášení tím spadnou naráz.
 *
 * Dotaz do databáze navíc to nestojí: volá se tam, kde se stejně načítá
 * uživatel — v kontrole předplatného u API a v kontrole přístupu
 * u stránek aplikace.
 */

/**
 * Je token vydaný v `issuedAt` (v sekundách) ještě platný?
 *
 * Vteřinová rezerva je tu kvůli tomu, že `iat` v tokenu je zaokrouhlené
 * na sekundy dolů, kdežto značka v databázi má milisekundy. Bez ní by se
 * uživatel po změně hesla odhlásil i z toho zařízení, na kterém heslo
 * právě měnil.
 */
export function isTokenValid(
  issuedAt: number | undefined,
  validFrom: Date,
): boolean {
  if (!issuedAt) return false;
  return issuedAt * 1000 >= validFrom.getTime() - 1000;
}

/** Posune hranici platnosti na teď — odhlásí všechna zařízení. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { sessionsValidFrom: new Date() },
  });
}
