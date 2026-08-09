/**
 * Paleta pro rozlišení cílů.
 *
 * Když běží víc cílů, denní seznam je jejich směs a bez barvy se dá jen
 * hádat, který úkol kam patří. Barva to řekne dřív, než člověk začne číst.
 *
 * Odstíny jsou tu jako hodnoty, ne jako názvy tříd. Tailwind si třídy hledá
 * v kódu jako doslovný text, takže `text-${color}-400` by ve výsledném CSS
 * nikdy neskončilo. Přes proměnnou v `style` to funguje spolehlivě a barvu
 * lze zároveň použít v průhlednosti i v obrysu.
 */

export const goalColors = [
  "lime",
  "emerald",
  "cyan",
  "sky",
  "violet",
  "pink",
  "rose",
  "amber",
] as const;

export type GoalColor = (typeof goalColors)[number];

/** Odstíny volené tak, aby byly čitelné na tmavém podkladu. */
const HEX: Record<GoalColor, string> = {
  lime: "#a3e635",
  emerald: "#34d399",
  cyan: "#22d3ee",
  sky: "#60a5fa",
  violet: "#a78bfa",
  pink: "#f472b6",
  rose: "#fb7185",
  amber: "#fbbf24",
};

export function isGoalColor(value: unknown): value is GoalColor {
  return (
    typeof value === "string" && (goalColors as readonly string[]).includes(value)
  );
}

/** Barva cíle; u neznámé hodnoty výchozí odstín, ne prázdno. */
export function goalHex(color: string): string {
  return isGoalColor(color) ? HEX[color] : HEX.lime;
}

/**
 * Proměnná do `style`. Komponenty ji pak berou přes `var(--goal)`,
 * takže barva prosákne i do vnořených prvků.
 */
export function goalStyle(color: string): React.CSSProperties {
  return { "--goal": goalHex(color) } as React.CSSProperties;
}
