import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Nastavení testů.
 *
 * Testuje se logika, ne rámec: čisté funkce nad daty, kde se dá chyba
 * spočítat na papíře. Komponenty, databáze ani volání modelu tu nejsou
 * a schválně — jejich obsluha se mění často a testy k nim by jen
 * zdržovaly, aniž by chytily to, co nás doopravdy pálilo.
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      /*
       * `server-only` je stráž pro balíčkovač: při importu mimo server
       * schválně vyhodí výjimku. V testech běžíme v Node, kde je ta
       * stráž zbytečná a jen by zabránila načíst testovaný soubor.
       */
      {
        find: /^server-only$/,
        replacement: fileURLToPath(new URL("./tests/empty.ts", import.meta.url)),
      },
    ],
  },
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
  },
});
