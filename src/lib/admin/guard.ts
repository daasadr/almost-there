import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { env } from "@/lib/env";

/**
 * Kdo smí do správy.
 *
 * Seznam je v prostředí, ne v databázi — viz komentář u `env.adminEmails`.
 * Když seznam chybí nebo je prázdný, do správy nesmí nikdo. Prázdná
 * konfigurace nesmí znamenat otevřená vrátka.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = env.adminEmails;
  if (admins.length === 0) return false;
  return admins.includes(email.toLowerCase());
}

export type AdminSession = { id: string; email: string };

/** Pro stránky. Vrací `null`, když přihlášený správcem není. */
export async function currentAdmin(): Promise<AdminSession | null> {
  const session = await auth();
  const email = session?.user?.email;

  if (!session?.user?.id || !isAdminEmail(email)) return null;
  return { id: session.user.id, email: email! };
}

type AdminGuard =
  | { ok: true; admin: AdminSession }
  | { ok: false; response: NextResponse };

/**
 * Pro API. Nepřihlášený i nesprávce dostanou 404, ne 403 — o tom, že
 * nějaká správa vůbec existuje, nemá cizí člověk zjistit nic.
 */
export async function requireAdmin(): Promise<AdminGuard> {
  const admin = await currentAdmin();
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false }, { status: 404 }),
    };
  }
  return { ok: true, admin };
}
