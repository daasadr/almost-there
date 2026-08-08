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

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return await callOnce(options);
    } catch (error) {
      // Odmítnutí modelu je rozhodnutí, ne výpadek — opakování by ho
      // jen zopakovalo a stálo dvakrát tolik.
      if (error instanceof AiRefusalError) throw error;

      lastError = error;
      console.warn(
        `[ai] pokus ${attempt} z ${ATTEMPTS} selhal`,
        error instanceof Error ? error.message : error,
      );
    }
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

  if (response.stop_reason === "refusal") {
    throw new AiRefusalError(
      response.stop_details?.explanation ?? "Request declined.",
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiFormatError("Model returned no text content.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new AiFormatError("Model returned malformed JSON.");
  }

  const result = parser.safeParse(parsed);
  if (!result.success) {
    throw new AiFormatError(
      `Model output did not match the schema: ${result.error.message}`,
    );
  }

  return {
    data: result.data,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model,
    },
  };
}
