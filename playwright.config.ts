import { defineConfig, devices } from "@playwright/test";

/**
 * Nastavení průchodových testů.
 *
 * Tyhle testy hlídají hrstku cest, které musí fungovat vždycky —
 * přihlášení, hranici předplatného, demo a přepínání vzhledu. Nejsou od
 * toho, aby pokryly aplikaci; od toho jsou jednotkové testy nad logikou.
 * Tady jde o to chytit, když se rozpadne něco, co drží celek pohromadě.
 *
 * PŘEDPOKLAD: běžící aplikace a databáze. Nejjednodušeji:
 *
 *   docker compose up -d db
 *   DEMO_MOCK=true npm run dev
 *   npm run e2e
 *
 * `DEMO_MOCK=true` je důležité — bez něj by každý běh volal model,
 * stál peníze a vracel pokaždé něco jiného. Test, jehož výsledek se
 * mění, nic nehlídá.
 */

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  /* Jeden pracovník: testy zakládají účty ve sdílené databázi. */
  workers: 1,
  fullyParallel: false,
  /* Na počítači žádné opakování — zakrývalo by nestabilitu. V CI jedno,
     kvůli výpadkům sítě a časování. */
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL,
    /* Stopa jen u toho, co spadlo — jinak zabere stovky megabajtů. */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        /* Běžící vývojový server se použije, místo aby se spouštěl druhý. */
        reuseExistingServer: true,
        timeout: 120_000,
        env: { DEMO_MOCK: "true" },
      },
});
