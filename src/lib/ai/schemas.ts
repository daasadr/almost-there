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
  /**
   * Pořadí od dneška, 1 = první období.
   *
   * Bez omezení na kladné číslo schválně: hodnotu přepisujeme podle pořadí
   * v poli, takže by validace shodila celý rozpad kvůli údaji, který stejně
   * zahodíme.
   */
  index: z.number().int(),
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

// ---------------------------------------------------------------------------
// Nižší úrovně rozpadu (zadání, bod 6 — fáze 2 a 3)
// ---------------------------------------------------------------------------

/**
 * Rozpad jednoho bloku na bloky o úroveň níž: rok → měsíce, měsíc → týdny.
 *
 * Je to jedna funkce pro obě úrovně schválně. Zadání je pokaždé stejné —
 * „vezmi tenhle úsek a rozděl ho na kratší" — a dvě skoro totožné větve
 * by se časem rozešly.
 */
export const childBlockSchema = z.object({
  /** Pořadí v rámci rodiče. Přepisujeme ho, tak na něm netrváme. */
  index: z.number().int(),
  title: z.string().min(1),
  /** Co musí být na konci tohohle úseku hotové. */
  summary: z.string().min(1),
});

export const blockChildrenSchema = z.object({
  children: z.array(childBlockSchema).min(1),
});

export type ChildBlock = z.infer<typeof childBlockSchema>;

/** Typ denního úkolu. Odpočinek a reflexe jsou plnohodnotné položky
 *  plánu, ne poznámka pod čarou — v tom je celý rozdíl oproti to-do listu. */
export const taskTypes = ["ACTION", "REST", "REFLECTION"] as const;
export type TaskTypeName = (typeof taskTypes)[number];

export const dayTaskSchema = z.object({
  title: z.string().min(1),
  /** Nepovinné upřesnění — co přesně dělat, když z názvu není jasné. */
  description: z.string().optional(),
  type: z.enum(taskTypes),
  /**
   * Nula je platná hodnota, ne chyba. U odpočinku a někdy i u reflexe
   * nedává odhad v minutách smysl a model ji vrací správně — dřívější
   * podmínka „kladné číslo“ kvůli tomu zahazovala celý týdenní rozpad.
   */
  estimatedMinutes: z.number().int().min(0).max(1440),
});

export const daySchema = z.object({
  /** Pořadí dne v týdnu. Hodnotu stejně přepisujeme podle pořadí v poli,
   *  tak na ní nemá cenu trvat — viz `index` u období. */
  index: z.number().int(),
  /** Čím je ten den daný — jedna věta. */
  summary: z.string().min(1),
  tasks: z.array(dayTaskSchema),
});

export const weekDaysSchema = z.object({
  days: z.array(daySchema).min(1),
});

export type DayTask = z.infer<typeof dayTaskSchema>;
export type PlannedDay = z.infer<typeof daySchema>;

/** JSON Schema pro rozpad bloku na podbloky. */
export function buildChildrenJsonSchema(childUnit: string, count: number) {
  return {
    type: "object",
    properties: {
      children: {
        type: "array",
        description: `Exactly ${count} ${childUnit}s, in chronological order.`,
        items: {
          type: "object",
          properties: {
            index: {
              type: "integer",
              description: `1-based position of this ${childUnit} within the parent period.`,
            },
            title: {
              type: "string",
              description:
                "Short label, at most six words. No numbering, no dates.",
            },
            summary: {
              type: "string",
              description: `What must be true at the end of this ${childUnit}. One or two sentences, concrete and checkable.`,
            },
          },
          required: ["index", "title", "summary"],
          additionalProperties: false,
        },
      },
    },
    required: ["children"],
    additionalProperties: false,
  } as const;
}

/** JSON Schema pro rozpad týdne na dny s úkoly. */
export function buildDaysJsonSchema(count: number) {
  return {
    type: "object",
    properties: {
      days: {
        type: "array",
        description: `Exactly ${count} days, in chronological order.`,
        items: {
          type: "object",
          properties: {
            index: {
              type: "integer",
              description: "1-based position of this day within the week.",
            },
            summary: {
              type: "string",
              description:
                "One sentence describing what this day is for. On a rest day, say so plainly.",
            },
            tasks: {
              type: "array",
              description:
                "Tasks for this day. A working day usually has one to three. A rest day has a REST task and nothing else.",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description:
                      "What to do, phrased so the person knows when it is finished. At most twelve words.",
                  },
                  description: {
                    type: "string",
                    description:
                      "Optional one-sentence detail. Leave out when the title says everything.",
                  },
                  type: {
                    type: "string",
                    enum: ["ACTION", "REST", "REFLECTION"],
                    description:
                      "ACTION moves the goal forward, REST is deliberate recovery, REFLECTION is reviewing how it is going.",
                  },
                  estimatedMinutes: {
                    type: "integer",
                    description:
                      "Realistic time in minutes. Must fit within the person's stated daily capacity together with the other tasks of that day. Use 0 when a duration makes no sense, typically for a REST task.",
                  },
                },
                required: ["title", "type", "estimatedMinutes"],
                additionalProperties: false,
              },
            },
          },
          required: ["index", "summary", "tasks"],
          additionalProperties: false,
        },
      },
    },
    required: ["days"],
    additionalProperties: false,
  } as const;
}

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
