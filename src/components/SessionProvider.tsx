"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Session se načítá na klientovi, ne na serveru.
 *
 * Kdyby ji layout zjišťoval serverově, přestaly by se stránky předgenerovat
 * staticky — a landing page je marketingová, ta má být statická. Takhle
 * zůstává rychlá a hlavička si stav přihlášení doplní až v prohlížeči.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
