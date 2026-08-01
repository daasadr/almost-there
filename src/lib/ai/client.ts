import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let client: Anthropic | null = null;

/**
 * Klient Anthropic API. Vytváří se líně, aby build neselhal na chybějícím
 * klíči — ten je potřeba až při prvním skutečném volání.
 */
export function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return client;
}
