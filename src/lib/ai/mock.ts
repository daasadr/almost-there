import type { DecomposeInput, DecomposeResult } from "./decompose";
import { monthsUntil } from "./decompose";

/**
 * Ukázková odpověď pro vývoj bez spotřeby tokenů (DEMO_MOCK=true).
 * Struktura je shodná s reálným výstupem, takže UI se dá ladit naslepo.
 */
export async function mockDecomposeIntoMonths(
  input: DecomposeInput,
): Promise<DecomposeResult> {
  const monthCount = Math.min(monthsUntil(input.targetDate), 12);

  // Malé zdržení, ať je vidět stav načítání.
  await new Promise((resolve) => setTimeout(resolve, 900));

  const months = Array.from({ length: monthCount }, (_, i) => ({
    index: i + 1,
    title: `Milestone ${i + 1}`,
    milestone:
      i === monthCount - 1
        ? "Consolidate everything from the previous months, close the remaining gaps and do a full run-through against the original goal. No new material this month."
        : `Build the ${i === 0 ? "foundations" : "next layer"} for “${input.goal}”. By the end of this month you can demonstrate concrete progress you could not at the start.`,
  }));

  return {
    plan: {
      goalRestated: `You want to achieve: ${input.goal}`,
      assumptions: [
        "You can spend around an hour a day on this.",
        "You are starting close to zero and have no hard prior deadline in the way.",
      ],
      months,
      feasibility: "realistic",
      feasibilityNote:
        "The timeframe works if you keep a steady weekly rhythm rather than working in bursts.",
    },
    usage: { inputTokens: 0, outputTokens: 0, model: "mock" },
  };
}
