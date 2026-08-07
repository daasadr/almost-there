import { db } from "@/lib/db";
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
};

export async function getAccess(userId: string): Promise<Access> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true },
  });

  // Uživatel bez záznamu je smazaný nebo neexistuje — v obou případech neplatí.
  const status = user?.subscriptionStatus ?? "NONE";
  return { status, hasAccess: WITH_ACCESS.includes(status) };
}
