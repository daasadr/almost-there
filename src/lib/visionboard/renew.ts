import "server-only";
import { db } from "@/lib/db";
import { readOwnLicense, signLicense } from "./license";

/**
 * Obnova a deaktivace licence.
 *
 * Obojí vychází z licence samotné, ne z přihlášení: aplikace žádný účet
 * nedrží, drží jen podepsaný token. Ten je zároveň průkazem — kdo ho má
 * a projde nám ověřením podpisu, je ten, komu jsme ho vydali.
 *
 * Kontrakt: `docs/visionboard-api.md`, oddíly 3.2 a 3.3.
 */

export type RenewError = "invalid_request" | "invalid_license" | "revoked";

export const RENEW_STATUS: Record<RenewError, number> = {
  invalid_request: 400,
  invalid_license: 400,
  revoked: 403,
};

export type RenewFacts = {
  /** Komu a které instalaci licence patří. Prázdné u neplatné. */
  claims: { sub: string; iid: string } | null;
  /** Je instalace u nás vedená a aktivní? */
  installationActive: boolean;
  /** Má účet pořád nárok? */
  accountUsable: boolean;
};

export type RenewDecision = { ok: true } | { ok: false; error: RenewError };

/**
 * Smí se licence obnovit?
 *
 * Odebrané zařízení a zaniklý účet jsou pro aplikaci totéž: `revoked`.
 * Rozlišovat by znamenalo prozradit cizímu držiteli tokenu, jestli účet
 * ještě existuje — a aplikaci to k ničemu není, protože v obou
 * případech má udělat totéž, tedy licenci zahodit a nabídnout aktivaci.
 */
export function decideRenew(facts: RenewFacts): RenewDecision {
  if (!facts.claims) return { ok: false, error: "invalid_license" };
  if (!facts.accountUsable || !facts.installationActive) {
    return { ok: false, error: "revoked" };
  }
  return { ok: true };
}

export type RenewResult =
  | { ok: true; license: string }
  | { ok: false; error: RenewError };

export async function renewLicense(token: string): Promise<RenewResult> {
  /*
   * Prošlá licence projde, do devadesáti dnů.
   *
   * Řeší to `readOwnLicense` tolerancí v ověření. Kdo aplikaci nespustil
   * čtvrt roku, aktivuje znovu; kdo ji nespustil týden, nemá kvůli tomu
   * přijít o nic. Obnovu si aplikace říká sama 14 dní před koncem, takže
   * sem se běžně chodí s licencí ještě platnou.
   */
  const claims = await readOwnLicense(token);

  const installation = claims
    ? await db.visionBoardInstallation.findUnique({
        where: {
          userId_installationId: { userId: claims.sub, installationId: claims.iid },
        },
        select: { id: true, deactivatedAt: true },
      })
    : null;

  const account = claims
    ? await db.user.findUnique({
        where: { id: claims.sub },
        select: { email: true, deletedAt: true, invitedById: true },
      })
    : null;

  const decision = decideRenew({
    claims,
    installationActive: Boolean(installation && !installation.deactivatedAt),
    accountUsable: Boolean(account && !account.deletedAt),
  });

  if (!decision.ok) return { ok: false, error: decision.error };
  if (!claims || !installation || !account) {
    return { ok: false, error: "revoked" };
  }

  await db.visionBoardInstallation.update({
    where: { id: installation.id },
    data: { lastRenewedAt: new Date() },
  });

  /*
   * Nová licence nese tytéž `sub` a `iid` a nové `exp`.
   *
   * `jti` zůstává id téhož záznamu instalace — licence se neobnovuje
   * jako nová věc, jen se prodlužuje platnost té stávající.
   */
  const license = await signLicense({
    userId: claims.sub,
    installationId: claims.iid,
    installationRecordId: installation.id,
    email: account.email,
    src: account.invitedById ? "invite" : "account",
  });

  return { ok: true, license };
}

/**
 * Uvolní zařízení.
 *
 * Odpovídá se úspěchem i tehdy, když instalace už deaktivovaná byla
 * nebo u nás vůbec není. Aplikace si licenci maže lokálně tak jako tak
 * a tohle volání je jen zdvořilost — chybou by se z ní stala překážka.
 *
 * Neplatný podpis je něco jiného: ten znamená, že se uvolňuje něco
 * cizího, a to projít nesmí.
 */
export async function deactivateLicense(
  token: string,
): Promise<{ ok: true } | { ok: false; error: RenewError }> {
  const claims = await readOwnLicense(token);
  if (!claims) return { ok: false, error: "invalid_license" };

  await db.visionBoardInstallation.updateMany({
    where: {
      userId: claims.sub,
      installationId: claims.iid,
      deactivatedAt: null,
    },
    data: { deactivatedAt: new Date() },
  });

  return { ok: true };
}
