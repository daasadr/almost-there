import { expect, test } from "@playwright/test";

/**
 * Demo je jediná cesta, kterou projde návštěvník bez účtu — a zároveň
 * to hlavní, co má přesvědčit, že produkt stojí za peníze. Když se
 * rozbije, nikdo se nedozví, o co jde.
 *
 * Běží proti atrapě modelu (`DEMO_MOCK=true`), takže je rychlé, zdarma
 * a pokaždé stejné.
 */

test("z cíle a termínu vznikne plán", async ({ page }) => {
  await page.goto("/cs/demo");

  await page
    .getByLabel("Jaký je tvůj cíl?")
    .fill("Naučit se plavat kraul na 500 metrů");

  // Termín zhruba za rok, ať vyjde rozpad na měsíce.
  const target = new Date();
  target.setFullYear(target.getFullYear() + 1);
  await page.getByLabel("Do kdy?").fill(target.toISOString().slice(0, 10));

  await page.getByRole("button", { name: "Rozfázovat cíl" }).click();

  // Rozpad trvá i s atrapou chvíli — čeká se na výsledek, ne na čas.
  await expect(page.getByText(/Tvé měsíční fáze|fáze/i).first()).toBeVisible({
    timeout: 60_000,
  });

  // Naměřený čas je součást sdělení: ukazuje, co by ručně zabralo hodiny.
  await expect(page.getByText(/Hotovo za/)).toBeVisible();
});
