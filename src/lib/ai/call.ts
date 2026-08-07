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

export async function callStructured<T>({
  system,
  user,
  jsonSchema,
  parser,
  maxTokens = 16000,
}: {
  system: string;
  user: string;
  /** JSON Schema pro `output_config.format` — vynutí tvar odpovědi. */
  jsonSchema: Record<string, unknown>;
  /** Zod schéma. Model tvar dodržet má, ale spoléhat se na to nebudeme. */
  parser: z.ZodType<T>;
  maxTokens?: number;
}): Promise<AiCallResult<T>> {
  const model = env.anthropicModel;

  const response = await getAnthropic().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    output_config: {
      effort: env.anthropicEffort,
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
