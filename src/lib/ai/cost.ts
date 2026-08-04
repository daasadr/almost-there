/**
 * Odhad nákladů na volání AI.
 *
 * Slouží ke dvěma věcem: hned teď k tomu, aby bylo v logu vidět, co která
 * operace stála, a později jako podklad pro měsíční strop spotřeby na
 * uživatele (zadání, bod 9) — ten se bez měření nastavit nedá.
 *
 * Pozor: `outputTokens` zahrnují i tokeny přemýšlení modelu, které se účtují
 * jako výstup. U rozpadu cíle tvoří většinu ceny, takže odhad podle délky
 * výsledného JSONu by byl výrazně podstřelený.
 */

/** Ceník Anthropic API v USD za milion tokenů. */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

/** Záložní ceník pro neznámý model — raději nadhodnotit než podhodnotit. */
const FALLBACK = { input: 5, output: 25 };

export type Usage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export function estimateCostUsd(usage: Usage): number {
  const price = PRICING[usage.model] ?? FALLBACK;
  return (
    (usage.inputTokens / 1_000_000) * price.input +
    (usage.outputTokens / 1_000_000) * price.output
  );
}

/**
 * Kurz USD/CZK. Přesnost tu není kritická — jde o řádový přehled v logu,
 * ne o účetnictví. Kdyby se kurz výrazně pohnul, přenastav přes prostředí.
 */
function usdCzkRate(): number {
  const raw = Number.parseFloat(process.env.USD_CZK_RATE ?? "");
  return Number.isFinite(raw) && raw > 0 ? raw : 23.5;
}

/** Náklady v haléřích — celé číslo, ať se dá bez ztráty sčítat v databázi. */
export function estimateCostHellers(usage: Usage): number {
  return Math.round(estimateCostUsd(usage) * usdCzkRate() * 100);
}

/** Jeden řádek do logu, ať je spotřeba vidět bez dolování z API konzole. */
export function formatUsage(label: string, usage: Usage): string {
  const usd = estimateCostUsd(usage);
  const czk = (usd * usdCzkRate()).toFixed(2);
  return (
    `[ai] ${label} model=${usage.model} ` +
    `vstup=${usage.inputTokens} výstup=${usage.outputTokens} ` +
    `cena≈$${usd.toFixed(4)} (${czk} Kč)`
  );
}
