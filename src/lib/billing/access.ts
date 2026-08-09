import { db } from "@/lib/db";
import { isTokenValid } from "@/lib/auth/session";
import type { SubscriptionStatus } from "@/generated/prisma";

/**
 * Zjištění, zda uživatel zaplatil.
 *
 * Čte se vždy z databáze, nikdy z přihlašovacího tokenu. Předplatné se mění
 * webhookem od Stripu — tedy mimo přihlášení — a token by o té změně nevěděl
 * až do dalšího přihlášení. Uživatel by zaplatil a dál koukal na paywall.
 *
 * Je to jeden dotaz navíc na načtení stránky. Za to, že stav odpovídá
 * skutečnosti, to stojí.
 */

/** ACTIVE i TRIAL znamenají „má přístup". PAST_DUE ne — neuhrazená
 *  platba nesmí držet přístup otevřený donekonečna. */
const WITH_ACCESS: SubscriptionStatus[] = ["ACTIVE", "TRIAL"];

export type Access = {
  status: SubscriptionStatus;
  hasAccess: boolean;
  /** Přihlášení bylo vydáno před poslední změnou hesla a už neplatí. */
  revoked: boolean;
};

export async function getAccess(
  userId: string,
  /** Kdy byl token vydán, ze session. Bez něj se odvolání nekontroluje. */
  issuedAt?: number,
): Promise<Access> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionSource: true,
      subscriptionEndsAt: true,
      sessionsValidFrom: true,
    },
  });

  // Uživatel bez záznamu je smazaný nebo neexistuje — v obou případech neplatí.
  const status = user?.subscriptionStatus ?? "NONE";
  let hasAccess = WITH_ACCESS.includes(status);

  // Přístup přidělený na dobu určitou nikdo neukončuje — u placeného to
  // udělá webhook od Stripu, tady žádný takový posel není. Datum konce
  // proto kontrolujeme při čtení.
  //
  // Jen u přiděleného přístupu: u placeného je `subscriptionEndsAt` konec
  // právě běžícího období a opozdilý webhook by jinak vzal přístup člověku,
  // který řádně platí.
  if (
    hasAccess &&
    user?.subscriptionSource === "COMPLIMENTARY" &&
    user.subscriptionEndsAt &&
    user.subscriptionEndsAt.getTime() < Date.now()
  ) {
    hasAccess = false;
  }

  // Token starší než poslední změna hesla neplatí, i když má správný
  // podpis. Volá se tady, protože stránky aplikace stejně načítají
  // uživatele — kontrola tak nestojí dotaz navíc.
  const revoked =
    issuedAt !== undefined &&
    user !== null &&
    !isTokenValid(issuedAt, user.sessionsValidFrom);

  return { status, hasAccess: hasAccess && !revoked, revoked };
}
