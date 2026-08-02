import type { DecomposeInput, DecomposeResult } from "./decompose";
import { daysUntil, periodCount, pickPlanLevel } from "./decompose";

/**
 * Ukázková odpověď pro vývoj bez spotřeby tokenů (DEMO_MOCK=true).
 * Struktura je shodná s reálným výstupem včetně volby úrovně, takže se
 * dá naslepo ladit i chování u víceletých cílů.
 */
export async function mockDecomposeGoal(
  input: DecomposeInput,
): Promise<DecomposeResult> {
  const days = daysUntil(input.targetDate);
  const level = pickPlanLevel(days);
  const count = periodCount(days, level);

  // Malé zdržení, ať je vidět stav načítání.
  await new Promise((resolve) => setTimeout(resolve, 900));

  const periods = Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    title: `Milestone ${i + 1}`,
    milestone:
      i === count - 1
        ? "Consolidate everything from the previous periods, close the remaining gaps and do a full run-through against the original goal. No new material here."
        : `Build the ${i === 0 ? "foundations" : "next layer"} for “${input.goal}”. By the end of this period you can demonstrate concrete progress you could not at the start.`,
  }));

  return {
    plan: {
      goalRestated: `You want to achieve: ${input.goal}`,
      assumptions: [
        "You can spend around an hour a day on this.",
        "You are starting close to zero and have no hard prior deadline in the way.",
      ],
      level,
      periods,
      feasibility: "realistic",
      feasibilityNote:
        "The timeframe works if you keep a steady rhythm rather than working in bursts.",
    },
    usage: { inputTokens: 0, outputTokens: 0, model: "mock" },
  };
}
