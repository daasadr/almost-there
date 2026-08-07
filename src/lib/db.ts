import "server-only";
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma klient.
 *
 * Od Prismy 7 se připojení nebere ze schématu, ale předává se driver
 * adaptérem — proto ten `PrismaPg`.
 *
 * Vytváří se líně, až při prvním dotazu. Kdyby vznikal při načtení modulu,
 * spadl by build: Next.js si při něm naimportuje všechny route soubory,
 * aby zjistil jejich nastavení, a v Dockeru při buildu žádná databáze
 * ani její adresa neexistuje — ta přijde až za běhu.
 *
 * Instance se drží na globálním objektu. Ve vývoji Next.js při každé změně
 * kódu modul znovu načte, a bez tohohle by vzniklo desítky spojení,
 * dokud by databáze nezačala odmítat další.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Chybí DATABASE_URL. Zkopíruj .env.example do .env.local a doplň ji.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    // V produkci nechceme každý dotaz v logu, chyby ano.
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Chová se jako běžný `PrismaClient`, ale skutečný klient vznikne až při
 * prvním použití. Metody navazujeme zpět na klienta — jinak by `this`
 * uvnitř ukazovalo na tenhle obal a věci jako `$transaction` by selhaly.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, property, _receiver) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
