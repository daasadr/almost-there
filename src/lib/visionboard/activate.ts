import "server-only";
import { db } from "@/lib/db";
import { consumeActivationCode, type ConsumeResult } from "./activation";
import { signLicense } from "./license";

/**
 * Výměna aktivačního kódu za licenci.
 *
 * Rozhodování je schválně oddělené od sahání do databáze
 * (`decideActivation` níž). Jde o matici pěti chybových stavů, kterou
 * druhá strana zná nazpaměť a podle které skládá hlášky pro uživatele —
 * a ověřit ji nad živou databází by znamenalo šest různých účtů
 * v šesti stavech. Takhle se dá projít celá a za vteřinu.
 *
 * Kontrakt: `docs/visionboard-api.md`, oddíl 3.1.
 */

/** Kolik zařízení smí mít jeden účet zároveň. Rozhodnutí Dagmar. */
export const MAX_INSTALLATIONS = 3;

export type ActivationError =
  | "invalid_request"
  | "invalid_code"
  | "expired_code"
  | "no_license"
  | "too_many_installations"
  | "rate_limited";

/** Stav HTTP ke každé chybě. Kontrakt, oddíl 3.4. */
export const ERROR_STATUS: Record<ActivationError, number> = {
  invalid_request: 400,
  invalid_code: 400,
  expired_code: 400,
  no_license: 403,
  too_many_installations: 403,
  rate_limited: 429,
};

/**
 * Kolik pokusů o aktivaci z jedné adresy za minutu. Kontrakt, oddíl 3.4.
 *
 * Deset je štědré: poctivá aktivace je jedno volání a opakuje se jen
 * tehdy, když něco selže. Zároveň to stačí na celou domácnost nebo
 * kancelář za jednou adresou, kde se počítače tváří jako jeden.
 *
 * Proti hádání kódu to samo o sobě není — dvanáct znaků z třiceti je
 * skoro šedesát bitů a ty se neuhodnou ani za roky. Je to druhá vrstva
 * pod tím, že se kód spálí při prvním uplatnění.
 */
export const ATTEMPTS_PER_MINUTE = 10;
export const ATTEMPT_WINDOW_MS = 60_000;

export type ActivationFacts = {
  /** Co vyšlo z uplatnění kódu. */
  code: ConsumeResult;
  /** Má účet pořád nárok na licenci? Nemá ho smazaný ani neexistující. */
  accountUsable: boolean;
  /** Je tohle zařízení u účtu už vedené? Pak nebere další místo. */
  installationKnown: boolean;
  /** Kolik **jiných** zařízení je u účtu aktivních. */
  otherActiveInstallations: number;
};

export type Decision = { ok: true } | { ok: false; error: ActivationError };

/**
 * Smí se licence vydat?
 *
 * Pořadí je dané kontraktem a není libovolné. Na špatný kód se
 * odpovídá dřív než na chybějící licenci, protože dokud nevíme, komu
 * kód patří, nemáme o čem mluvit — a hlavně se tím cizímu člověku
 * neprozradí, jestli daný účet licenci má.
 */
export function decideActivation(facts: ActivationFacts): Decision {
  if (!facts.code.ok) return { ok: false, error: facts.code.error };
  if (!facts.accountUsable) return { ok: false, error: "no_license" };

  // Známé zařízení se znovu aktivuje, i když je limit plný. Jinak by
  // přeinstalace počítače znamenala, že se člověk nemá jak vrátit.
  if (
    !facts.installationKnown &&
    facts.otherActiveInstallations >= MAX_INSTALLATIONS
  ) {
    return { ok: false, error: "too_many_installations" };
  }

  return { ok: true };
}

export type ActivationResult =
  | { ok: true; license: string }
  | { ok: false; error: ActivationError };

/**
 * Celý průběh aktivace: kód, kontroly, zápis zařízení, podpis licence.
 *
 * Kód se spotřebuje jako první a za všech okolností — i když se vzápětí
 * ukáže, že účet licenci nemá nebo je plný počet zařízení. Je to
 * schválně: jinak by šlo jedním kódem zkoušet dokola.
 */
export async function activateInstallation({
  code,
  verifier,
  installationId,
  platform,
}: {
  code: string;
  verifier: string;
  installationId: string;
  platform: string;
}): Promise<ActivationResult> {
  const consumed = await consumeActivationCode({ code, verifier });

  // Bez známého účtu nemá smysl se na nic ptát.
  if (!consumed.ok) return { ok: false, error: consumed.error };

  const account = await db.user.findUnique({
    where: { id: consumed.userId },
    select: { id: true, email: true, deletedAt: true, invitedById: true },
  });

  const existing = account
    ? await db.visionBoardInstallation.findUnique({
        where: {
          userId_installationId: { userId: account.id, installationId },
        },
        select: { id: true },
      })
    : null;

  const others = account
    ? await db.visionBoardInstallation.count({
        where: {
          userId: account.id,
          deactivatedAt: null,
          installationId: { not: installationId },
        },
      })
    : 0;

  const decision = decideActivation({
    code: consumed,
    accountUsable: Boolean(account && !account.deletedAt),
    installationKnown: Boolean(existing),
    otherActiveInstallations: others,
  });

  if (!decision.ok || !account) {
    return { ok: false, error: decision.ok ? "no_license" : decision.error };
  }

  /*
   * Zápis zařízení přes `upsert`.
   *
   * Táž dvojice účet + instalace je totéž zařízení, takže se při
   * opakované aktivaci jen oživí. `deactivatedAt: null` je tu
   * podstatné: zařízení, které si člověk dřív odebral, se tímhle
   * vrací zpátky a nevzniká druhý záznam.
   */
  const installation = await db.visionBoardInstallation.upsert({
    where: { userId_installationId: { userId: account.id, installationId } },
    create: { userId: account.id, installationId, platform },
    update: { platform, deactivatedAt: null, activatedAt: new Date() },
    select: { id: true },
  });

  const license = await signLicense({
    userId: account.id,
    installationId,
    installationRecordId: installation.id,
    email: account.email,
    src: account.invitedById ? "invite" : "account",
  });

  return { ok: true, license };
}
