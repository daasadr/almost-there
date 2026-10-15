import "server-only";
import { cookies } from "next/headers";
import { isValidChallenge, isValidState } from "./activation";

/**
 * Rozdělaná aktivace, která čeká na přihlášení.
 *
 * Aplikace otevře v prohlížeči adresu s `challenge`, `state` a platformou.
 * Kdo není přihlášený, musí se nejdřív přihlásit nebo zaregistrovat —
 * a tyhle tři údaje musí ten výlet přežít.
 *
 * ── Proč cookie, a ne návratová adresa ──────────────────────────────
 *
 * Nabízelo by se poslat celou adresu i s parametry jako `callbackUrl`.
 * Funguje to u přihlášení heslem, ale ne u registrace: ta jde přes
 * ověřovací e-mail, takže by se parametry musely protáhnout odkazem
 * v mailu a zpátky. Cookie přežije všechny tři cesty stejně.
 *
 * A má to druhý užitek. `challenge` v adrese se objeví v historii
 * prohlížeče, v logu serveru a v hlavičce `Referer`. Sám o sobě je
 * k ničemu — je to otisk, ne tajemství — ale není důvod ho rozsévat.
 *
 * ── Patnáct minut ───────────────────────────────────────────────────
 *
 * Víc než kód (ten má deset), protože tahle lhůta běží dřív: během ní
 * se člověk teprve přihlašuje nebo zakládá účet. Míň by znamenalo, že
 * kdo si zakládá heslo pořádně, aktivaci nestihne.
 */

const COOKIE = "vb_activation";
const TTL_SECONDS = 15 * 60;

export type PendingActivation = {
  challenge: string;
  state: string;
  platform: string;
};

const PLATFORMS = new Set(["windows", "macos", "linux"]);

/** Ověří parametry z adresy. Nic neověřeného se dál nepouští. */
export function readParams(params: {
  challenge?: string;
  state?: string;
  platform?: string;
}): PendingActivation | null {
  const { challenge, state, platform } = params;

  if (!challenge || !isValidChallenge(challenge)) return null;
  if (!state || !isValidState(state)) return null;

  return {
    challenge,
    state,
    // Neznámá platforma se nahradí, ne odmítne: je jen pro přehled
    // zařízení a kvůli ní nemá aktivace padat.
    platform: platform && PLATFORMS.has(platform) ? platform : "windows",
  };
}

export async function rememberActivation(
  pending: PendingActivation,
): Promise<void> {
  const store = await cookies();

  store.set(COOKIE, JSON.stringify(pending), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

/**
 * Co si pamatujeme z dřívějška.
 *
 * Obsah se ověřuje znovu, i když ho psala tahle aplikace. Cookie se dá
 * podstrčit a nic, co z ní přijde, se nesmí brát jako dané.
 */
export async function recallActivation(): Promise<PendingActivation | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return readParams({
      challenge: typeof parsed.challenge === "string" ? parsed.challenge : undefined,
      state: typeof parsed.state === "string" ? parsed.state : undefined,
      platform: typeof parsed.platform === "string" ? parsed.platform : undefined,
    });
  } catch {
    return null;
  }
}

export async function forgetActivation(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
