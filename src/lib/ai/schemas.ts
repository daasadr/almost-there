import { z } from "zod";

/**
 * Fáze 1 z bodu 6 zadání — nejvyšší úroveň rozpadu cíle.
 *
 * Úroveň není napevno „měsíce“. Cíl na deset let by se na 120 měsíců
 * rozpadat neměl — je to drahé, nepřehledné a stejně by se to celé
 * přepočítalo dřív, než se k pozdějším měsícům dojde. Horní úroveň se
 * proto volí podle délky horizontu: roky / měsíce / týdny.
 *
 * Nižší úrovně se generují až v plné verzi, průběžně a jen na dohlednou
 * budoucnost (zadání, bod 6 — doporučení pro implementaci).
 */

/** Nejvyšší úroveň rozpadu. Nižší úrovně z ní vycházejí. */
export const planLevels = ["year", "month", "week"] as const;
export type PlanLevel = (typeof planLevels)[number];

export const planPeriodSchema = z.object({
  /** Pořadí od dneška, 1 = první období. */
  index: z.number().int().positive(),
  /** Krátký štítek, pár slov — nadpis v UI. */
  title: z.string().min(1),
  /** Co musí být na konci období hotové, aby termín vyšel. */
  milestone: z.string().min(1),
});

export const planSchema = z.object({
  /** Jak AI cíl pochopila — uživatel si ověří, že se rozumíme. */
  goalRestated: z.string().min(1),
  /**
   * Předpoklady, ze kterých AI vycházela (dostupný čas, výchozí úroveň…).
   * Zobrazujeme je, aby bylo poznat, kde plán stojí na odhadu.
   */
  assumptions: z.array(z.string().min(1)),
  /** Na jakou jednotku je cíl rozložený. */
  level: z.enum(planLevels),
  periods: z.array(planPeriodSchema).min(1),
  /** Reálnost termínu — poctivá zpětná vazba místo slepého optimismu. */
  feasibility: z.enum(["comfortable", "realistic", "ambitious", "unrealistic"]),
  /** Jedna věta k tomu, proč zrovna tohle hodnocení. */
  feasibilityNote: z.string().min(1),
});

export type PlanPeriod = z.infer<typeof planPeriodSchema>;
export type Plan = z.infer<typeof planSchema>;

/**
 * JSON Schema pro `output_config.format`. Anthropic API vyžaduje
 * `additionalProperties: false` a explicitní `required` u každého objektu.
 *
 * `level` do schématu patří i přesto, že ho určujeme my — model tak vidí,
 * v jakých jednotkách má přemýšlet, a nemíchá je dohromady.
 */
export function buildPlanJsonSchema(level: PlanLevel) {
  const unit = level === "year" ? "year" : level === "month" ? "month" : "week";

  return {
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
      level: {
        type: "string",
        enum: [level],
        description: `Always "${level}" for this request.`,
      },
      periods: {
        type: "array",
        description: `One entry per ${unit} between today and the target date, in chronological order.`,
        items: {
          type: "object",
          properties: {
            index: {
              type: "integer",
              description: `1-based position of this ${unit} in the plan.`,
            },
            title: {
              type: "string",
              description:
                "Short label for the period, at most six words. No numbering.",
            },
            milestone: {
              type: "string",
              description: `What must be finished by the end of this ${unit} for the deadline to hold. One to three sentences, concrete and checkable.`,
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
      "level",
      "periods",
      "feasibility",
      "feasibilityNote",
    ],
    additionalProperties: false,
  } as const;
}
