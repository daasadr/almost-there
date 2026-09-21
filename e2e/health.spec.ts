import { expect, test } from "@playwright/test";

/**
 * Koncový bod, podle kterého se pozná, že aplikace funguje.
 *
 * Spoléhá na něj hlídač dostupnosti, Docker i čekací smyčka v nasazení.
 * Kdyby se rozbil nebo začal odpovídat jinak, přestal by kterýkoli z nich
 * dělat svou práci — a poznalo by se to až tím, že by nezabral ve chvíli,
 * kdy je potřeba. Proto tenhle test.
 */

test("/api/health hlásí, že aplikace žije", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ ok: true });
});

test("/api/health se nedá uložit do mezipaměti", async ({ request }) => {
  // Uložená odpověď „jsem zdravý" by hlídače uklidňovala ještě dlouho
  // poté, co aplikace přestala fungovat.
  const response = await request.get("/api/health");
  const cacheControl = response.headers()["cache-control"] ?? "";

  expect(cacheControl).toMatch(/no-store|no-cache|max-age=0/);
});
