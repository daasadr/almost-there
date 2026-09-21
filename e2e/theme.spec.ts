import { expect, test } from "@playwright/test";

/**
 * Volba vzhledu musí přežít pohyb po aplikaci.
 *
 * Tohle je tu proto, že se to jednou rozbilo způsobem, který nešlo
 * odhalit ničím jiným: přepnutí jazyka překreslí `<html lang>` a React
 * u toho zahodil značku motivu, protože ji tam nedal on. Build prošel,
 * typy seděly, ikonka dokonce ukazovala správný motiv — jen vzhled se
 * vrátil na výchozí.
 */

test("zvolený motiv přežije přechod na jinou stránku", async ({ page }) => {
  await page.goto("/cs");

  await page.getByRole("button", { name: "Styl" }).click();
  await page.getByRole("menuitemradio", { name: /Steampunk/ }).click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "steampunk");

  await page.goto("/cs/guide");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "steampunk");
});

test("zvolený motiv přežije přepnutí jazyka", async ({ page }) => {
  await page.goto("/cs");

  await page.getByRole("button", { name: "Styl" }).click();
  await page.getByRole("menuitemradio", { name: /Jungle/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "jungle");

  // Přepínač jazyka je v hlavičce jen na širším displeji.
  await page.getByLabel("Jazyk").selectOption("en");

  await expect(page).toHaveURL(/\/en(\/|$)/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "jungle");
});

test("návrat na Classic značku odstraní", async ({ page }) => {
  await page.goto("/cs");

  await page.getByRole("button", { name: "Styl" }).click();
  await page.getByRole("menuitemradio", { name: /Minimalist/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "minimalist");

  await page.getByRole("button", { name: "Styl" }).click();
  await page.getByRole("menuitemradio", { name: /Classic/ }).click();

  // Bez značky platí výchozí motiv z `:root`.
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
});
