import "server-only";
import { db } from "@/lib/db";

/**
 * Trvalý záznam zásahů provozovatele do zákaznických účtů.
 *
 * Do logu kontejneru se to psalo taky, jenže ten se po deseti megabajtech
 * přetáčí — a záznam, který zmizí, není záznam. Tohle je jediný způsob,
 * jak po měsících doložit, komu a proč byl přidělen bezplatný přístup.
 *
 * Zapisují se jen zásahy, které aplikace umožňuje. Číst obsah cílů mezi
 * ně nepatří, protože k tomu žádná cesta neexistuje — a kdyby někdy
 * vznikla, musí přibýt i sem.
 */

export type AdminAction = "GRANT_ACCESS" | "REVOKE_ACCESS";

export async function recordAdminAction({
  adminEmail,
  action,
  targetUserId,
  detail,
}: {
  adminEmail: string;
  action: AdminAction;
  targetUserId: string;
  detail?: string;
}): Promise<void> {
  // Do logu i do databáze. Log je po ruce při ladění, databáze vydrží.
  console.log(`[admin] ${adminEmail} · ${action} · ${targetUserId}`);

  try {
    await db.adminAuditEvent.create({
      data: { adminEmail, action, targetUserId, detail: detail ?? null },
    });
  } catch (error) {
    // Selhání zápisu nesmí shodit samotný zásah — ten už proběhl a
    // vracet ho zpátky kvůli účetnictví by nadělalo víc škody.
    console.error("[admin] záznam o zásahu se nepodařilo uložit", error);
  }
}

export type AuditRow = {
  id: string;
  adminEmail: string;
  action: string;
  targetUserId: string;
  targetEmail: string | null;
  detail: string | null;
  createdAt: Date;
};

/** Poslední zásahy pro přehled ve správě. */
export async function recentAdminActions(limit = 10): Promise<AuditRow[]> {
  const events = await db.adminAuditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // E-mail dotčeného účtu se dohledává zvlášť — záznam schválně drží jen
  // id, aby přežil i smazání účtu a nedržel osobní údaj déle, než je nutné.
  const users = await db.user.findMany({
    where: { id: { in: events.map((event) => event.targetUserId) } },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((user) => [user.id, user.email]));

  return events.map((event) => ({
    ...event,
    targetEmail: emailById.get(event.targetUserId) ?? null,
  }));
}
