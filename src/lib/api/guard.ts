import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getAccess } from "@/lib/billing/access";
import { isTokenValid } from "@/lib/auth/session";

/**
 * Vstupní kontrola pro API za paywallem.
 *
 * Přihlášení i předplatné se ověřuje tady, na serveru, při každém volání.
 * Že uživatel neuvidí tlačítko, není ochrana — endpoint si může zavolat
 * kdokoliv přímo.
 */

export type Subscriber = {
  id: string;
  timezone: string;
  locale: string;
};

type GuardResult =
  | { ok: true; user: Subscriber }
  | { ok: false; response: NextResponse };

export async function requireSubscriber(): Promise<GuardResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      ),
    };
  }

  const access = await getAccess(session.user.id);
  if (!access.hasAccess) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "notSubscribed" },
        { status: 403 },
      ),
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      timezone: true,
      locale: true,
      sessionsValidFrom: true,
    },
  });

  // Token vydaný před poslední změnou hesla už neplatí, i když je podpis
  // v pořádku. Bez tohohle by ukradené přihlášení změnu hesla přežilo.
  if (user && !isTokenValid(session.user.issuedAt, user.sessionsValidFrom)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      ),
    };
  }

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      ),
    };
  }

  return { ok: true, user };
}
