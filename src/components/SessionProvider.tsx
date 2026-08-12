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
  return (
    <SessionProvider
      // Bez tohohle se stav přihlášení dotahuje znovu při každém návratu
      // do okna — u někoho, kdo přepíná mezi kartami, to znamená desítky
      // volání za hodinu. Stav se v tu chvíli nemění; když ano (odhlášení,
      // změna hesla), pozná se to při první akci, protože přístup se
      // stejně ověřuje na serveru.
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
