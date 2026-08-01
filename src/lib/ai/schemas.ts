import { z } from "zod";

/**
 * Fáze 1 z bodu 6 zadání — měsíční rozpad cíle.
 *
 * Schéma je zároveň zdrojem pravdy pro strukturovaný výstup AI
 * (`output_config.format`) i pro validaci na straně serveru. JSON Schema níž
 * musí odpovídat tomu zodovému; API neumí `minLength`/`maximum` a podobná
 * omezení, takže délky hlídáme až po parsování.
 */

export const monthlyMilestoneSchema = z.object({
  /** Pořadí měsíce od dneška, 1 = první měsíc. */
  index: z.number().int().positive(),
  /** Krátký štítek, pár slov — nadpis v UI. */
  title: z.string().min(1),
  /** Co musí být na konci měsíce hotové, aby termín vyšel. */
  milestone: z.string().min(1),
});

export const monthlyPlanSchema = z.object({
  /** Jak AI cíl pochopila — uživatel si ověří, že se rozumíme. */
  goalRestated: z.string().min(1),
  /**
   * Předpoklady, ze kterých AI vycházela (dostupný čas, výchozí úroveň…).
   * Zobrazujeme je, aby bylo poznat, kde plán stojí na odhadu.
   */
  assumptions: z.array(z.string().min(1)),
  months: z.array(monthlyMilestoneSchema).min(1),
  /** Reálnost termínu — poctivá zpětná vazba místo slepého optimismu. */
  feasibility: z.enum(["comfortable", "realistic", "ambitious", "unrealistic"]),
  /** Jedna věta k tomu, proč zrovna tohle hodnocení. */
  feasibilityNote: z.string().min(1),
});

export type MonthlyMilestone = z.infer<typeof monthlyMilestoneSchema>;
export type MonthlyPlan = z.infer<typeof monthlyPlanSchema>;

/**
 * JSON Schema pro `output_config.format`. Anthropic API vyžaduje
 * `additionalProperties: false` a explicitní `required` u každého objektu.
 */
export const monthlyPlanJsonSchema = {
  type: "object",
  properties: {
    goalRestated: {
      type: "string",
      description:
        "One sentence restating the user's goal as you understood it, in the target language.",
    },
    assumptions: {
      type: "array",
      description:
        "2-4 short assumptions the plan rests on (available time per day, starting level, resources). Each one sentence.",
      items: { type: "string" },
    },
    months: {
      type: "array",
      description:
        "One entry per month between today and the target date, in chronological order.",
      items: {
        type: "object",
        properties: {
          index: {
            type: "integer",
            description: "1-based position of this month in the plan.",
          },
          title: {
            type: "string",
            description:
              "Short label for the month, at most six words. No numbering.",
          },
          milestone: {
            type: "string",
            description:
              "What must be finished by the end of this month for the deadline to hold. One to three sentences, concrete and checkable.",
          },
        },
        required: ["index", "title", "milestone"],
        additionalProperties: false,
      },
    },
    feasibility: {
      type: "string",
      enum: ["comfortable", "realistic", "ambitious", "unrealistic"],
      description: "Honest assessment of the deadline against the goal.",
    },
    feasibilityNote: {
      type: "string",
      description:
        "One sentence explaining the feasibility rating, addressed to the user.",
    },
  },
  required: [
    "goalRestated",
    "assumptions",
    "months",
    "feasibility",
    "feasibilityNote",
  ],
  additionalProperties: false,
} as const;
