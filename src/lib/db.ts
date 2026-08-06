import "server-only";
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma klient.
 *
 * Od Prismy 7 se připojení nebere ze schématu, ale předává se driver
 * adaptérem — proto ten `PrismaPg`.
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
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["error", "warn"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
