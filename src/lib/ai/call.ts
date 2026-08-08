import "server-only";
import type { z } from "zod";
import { getAnthropic } from "./client";
import { env } from "@/lib/env";

/**
 * Jedno strukturované volání modelu.
 *
 * Všechny tři fáze rozpadu potřebují totéž: pošli prompt, vynuť JSON podle
 * schématu, ověř ho zodem, vrať i spotřebu tokenů. Bez tohohle by se stejná
 * obsluha chyb psala třikrát a třikrát by se lišila.
 */

export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  model: string;
};

export type AiCallResult<T> = {
  data: T;
  usage: AiUsage;
};

export class AiRefusalError extends Error {
  readonly name = "AiRefusalError";
}

export class AiFormatError extends Error {
  readonly name = "AiFormatError";

  /**
   * Spotřeba, kterou neúspěšný pokus stál.
   *
   * Tokeny se platí i za odpověď, kterou zahodíme. Bez tohohle údaje by
   * účtování nevidělo právě ten případ, proti kterému má strop chránit —
   * volání, které selhává dokola.
   */
  constructor(
    message: string,
    readonly usage?: AiUsage,
  ) {
    super(message);
  }
}

/** Součet spotřeby napříč pokusy. Model je u všech stejný. */
function addUsage(a: AiUsage | null, b: AiUsage): AiUsage {
  if (!a) return b;
  return {
    model: b.model,
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
  };
}

/**
 * Kolikrát celkem to zkusit, když model vrátí něco, co neodpovídá schématu.
 *
 * Chyba tvaru je nedeterministická — druhý pokus se stejným zadáním obvykle
 * projde. Bez toho se selhání dostane až k uživateli, který si stejně nemůže
 * pomoct ničím jiným než kliknutím na „zkusit znovu“. Dvě jsou kompromis:
 * spolehlivost za nejvýš dvojnásobnou cenu ve vzácném případě.
 */
const ATTEMPTS = 2;

export type AiCallOptions<T> = {
  system: string;
  user: string;
  /** JSON Schema pro `output_config.format` — vynutí tvar odpovědi. */
  jsonSchema: Record<string, unknown>;
  /** Zod schéma. Model tvar dodržet má, ale spoléhat se na to nebudeme. */
  parser: z.ZodType<T>;
  maxTokens?: number;
  /** Model pro tuhle fázi. Bez uvedení ten hlavní z prostředí. */
  model?: string;
  /** Míra přemýšlení. Tvoří většinu ceny, tak se volí podle fáze. */
  effort?: "low" | "medium" | "high";
};

export async function callStructured<T>(
  options: AiCallOptions<T>,
): Promise<AiCallResult<T>> {
  let lastError: unknown;
  // Spotřeba zahozených pokusů. Připočte se k úspěšnému volání, aby se
  // zaplacené tokeny objevily v účtování i tehdy, když se odpověď nepoužila.
  let wasted: AiUsage | null = null;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const result = await callOnce(options);
      return wasted
        ? { ...result, usage: addUsage(wasted, result.usage) }
        : result;
    } catch (error) {
      // Odmítnutí modelu je rozhodnutí, ne výpadek — opakování by ho
      // jen zopakovalo a stálo dvakrát tolik.
      if (error instanceof AiRefusalError) throw error;

      if (error instanceof AiFormatError && error.usage) {
        wasted = addUsage(wasted, error.usage);
      }

      lastError = error;
      console.warn(
        `[ai] pokus ${attempt} z ${ATTEMPTS} selhal`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  // I když se nakonec nepovedlo nic, spotřebu musí volající zaúčtovat.
  if (wasted) {
    throw new AiFormatError(
      lastError instanceof Error ? lastError.message : "Rozpad se nezdařil.",
      wasted,
    );
  }

  throw lastError;
}

async function callOnce<T>({
  system,
  user,
  jsonSchema,
  parser,
  maxTokens = 16000,
  model = env.anthropicModel,
  effort = env.anthropicEffort,
}: AiCallOptions<T>): Promise<AiCallResult<T>> {
  const response = await getAnthropic().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    output_config: {
      effort,
      format: { type: "json_schema", schema: jsonSchema },
    },
    messages: [{ role: "user", content: user }],
  });

  // Spotřeba se čte dřív než výsledek: tokeny jsou zaplacené i tehdy,
  // když se odpověď ukáže jako nepoužitelná.
  const usage: AiUsage = {
    inputTokens: response.usage.input_tokens ?? 0,
    // Podle dokumentace API je `output_tokens` závazný součet pro účtování
    // a tokeny přemýšlení jsou v něm už zahrnuté.
    outputTokens: response.usage.output_tokens,
    model,
  };

  if (response.stop_reason === "refusal") {
    throw new AiRefusalError(
      response.stop_details?.explanation ?? "Request declined.",
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiFormatError("Model nevrátil žádný text.", usage);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new AiFormatError("Model vrátil poškozený JSON.", usage);
  }

  const result = parser.safeParse(parsed);
  if (!result.success) {
    // Cesta a důvod na jednom řádku. Celý výpis zoda je v logu nečitelný
    // a přesně kvůli tomu se posledně těžko hledalo, které pole zlobí.
    const issues = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "(kořen)"} — ${issue.message}`)
      .join("; ");

    throw new AiFormatError(`Odpověď neodpovídá schématu: ${issues}`, usage);
  }

  return { data: result.data, usage };
}
