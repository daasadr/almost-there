"use server";

import { auth } from "@/auth";
import { issueActivationCode } from "@/lib/visionboard/activation";
import { forgetActivation, recallActivation } from "@/lib/visionboard/pending";

/**
 * Potvrzení aktivace.
 *
 * Teprve tohle vydá kód — otevření stránky ne. Kdyby stačilo adresu
 * otevřít, stačilo by podstrčit přihlášenému člověku odkaz a jeho
 * licence by odešla na cizí počítač, aniž by o tom věděl. Kontrakt,
 * oddíl 8.
 *
 * Z formuláře se nebere nic. Účet se čte ze session a `challenge`
 * z cookie, kterou jsme sami napsali — kdyby `challenge` přišel
 * z klienta, mohl by si ho útočník podstrčit a vyměnit kód za licenci
 * pro svoje zařízení.
 *
 * Ochranu proti odeslání z cizí stránky řeší Next u serverových akcí
 * sám kontrolou původu požadavku.
 */

export type ConfirmState =
  | { status: "idle" }
  | { status: "done"; code: string; state: string }
  | { status: "failed"; reason: "expired" | "unauthorized" };

export async function confirmActivation(): Promise<ConfirmState> {
  const session = await auth();
  if (!session?.user?.id) return { status: "failed", reason: "unauthorized" };

  const pending = await recallActivation();
  if (!pending) return { status: "failed", reason: "expired" };

  const code = await issueActivationCode({
    userId: session.user.id,
    challenge: pending.challenge,
  });

  // Rozdělaná aktivace je vyřízená. Nechat ji ležet by znamenalo, že
  // druhé otevření stránky vydá druhý kód pro totéž.
  await forgetActivation();

  return { status: "done", code, state: pending.state };
}
