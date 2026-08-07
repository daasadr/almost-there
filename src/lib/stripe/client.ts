import "server-only";
import Stripe from "stripe";

/**
 * Klient Stripe.
 *
 * Vytváří se líně, ze stejného důvodu jako Prisma klient: při buildu si
 * Next.js naimportuje všechny route soubory a klíč tehdy ještě neexistuje.
 */

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "Chybí STRIPE_SECRET_KEY. Doplň ho do .env.local podle .env.example.",
      );
    }
    // Verzi API needitujeme — bereme tu, se kterou je sestavené SDK,
    // takže se typy a skutečné odpovědi nemůžou rozejít.
    client = new Stripe(key);
  }
  return client;
}

/** Běžíme na testovacích klíčích? Ukazujeme to v UI, ať se to nesplete. */
export function isTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
}
