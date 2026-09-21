import { expect, test } from "@playwright/test";

/**
 * Hranice mezi tím, co je veřejné, a tím, co je za přihlášením.
 *
 * Kdyby se propustnost téhle hranice rozbila, nic nespadne a build
 * projde — jen by se aplikace dala používat bez zaplacení, nebo by se
 * naopak nedalo dostat dovnitř. Obojí se pozná až podle zákazníků.
 */

const CHRANENE = [
  "/cs/app",
  "/cs/app/goals",
  "/cs/app/calendar",
  "/cs/app/settings",
];

for (const path of CHRANENE) {
  test(`${path} pošle nepřihlášeného na přihlášení`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/cs\/login/);
  });
}

test("veřejné stránky zůstávají veřejné", async ({ page }) => {
  for (const path of ["/cs", "/cs/demo", "/cs/guide", "/cs/terms", "/cs/privacy"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
  }
});

test("přihlašovací stránka nabídne registraci po neúspěchu", async ({ page }) => {
  // Kdo se snaží přihlásit, aniž by se zaregistroval, dostával jen
  // „e-mail nebo heslo nesouhlasí" a zkoušel to dokola.
  await page.goto("/cs/login");

  await page.getByLabel("E-mail").fill("nikdo@example.com");
  await page.getByLabel("Heslo").fill("SpatneHeslo123456");
  await page.getByRole("button", { name: "Přihlásit se" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("link", { name: /Zaregistruj se/ })).toBeVisible();
});
