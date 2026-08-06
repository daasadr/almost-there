import { defineConfig } from "prisma/config";

/**
 * Konfigurace Prisma CLI.
 *
 * Od Prismy 7 nepatří připojovací adresa do schématu — migrace a introspekce
 * ji berou odsud, běhová aplikace přes driver adaptér (viz src/lib/db.ts).
 *
 * Prisma CLI načítá `.env`, ale ne `.env.local`, který používá Next.js
 * pro lokální vývoj. Ať to funguje v obou případech, načteme si `.env.local`
 * ručně — na serveru žádný není a proměnná přijde z prostředí kontejneru.
 */

if (!process.env.DATABASE_URL) {
  loadEnvFile(".env.local");
}

function loadEnvFile(path: string): void {
  try {
    // Dynamický require, ať se to nepokouší běžet v prohlížeči.
    const fs = require("node:fs") as typeof import("node:fs");
    if (!fs.existsSync(path)) return;

    for (const line of fs.readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  } catch {
    // Když se soubor nepodaří přečíst, spolehneme se na prostředí.
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
