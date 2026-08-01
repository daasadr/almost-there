import "server-only";

/**
 * Přístup ke konfiguraci z prostředí na jednom místě.
 * Nikde jinde v kódu nesahej na `process.env` přímo — ať je vždy vidět,
 * co appka potřebuje a co se stane, když to chybí.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Chybí povinná proměnná prostředí ${name}. Zkopíruj .env.example do .env.local a doplň ji.`,
    );
  }
  return value;
}

function optionalInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  /** Mock režim: negeneruje se přes AI, vrací se ukázková data. */
  get demoMock(): boolean {
    return process.env.DEMO_MOCK === "true";
  },
  get anthropicApiKey(): string {
    return required("ANTHROPIC_API_KEY");
  },
  get anthropicModel(): string {
    return process.env.ANTHROPIC_MODEL || "claude-opus-5";
  },
  /**
   * Kolik přemýšlení má model do rozpadu vložit. Vyšší = kvalitnější plán,
   * ale delší čekání a víc tokenů. "medium" vychází jako rozumný kompromis
   * (rozpad trvá zhruba půl minuty); "low" znatelně zrychlí, "high" zpřesní.
   */
  get anthropicEffort(): "low" | "medium" | "high" {
    const value = process.env.ANTHROPIC_EFFORT;
    return value === "low" || value === "high" ? value : "medium";
  },
  get demoRateLimitPerHour(): number {
    return optionalInt("DEMO_RATE_LIMIT_PER_HOUR", 15);
  },
  get appUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
};
