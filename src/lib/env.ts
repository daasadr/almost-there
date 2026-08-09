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

function effortFrom(
  raw: string | undefined,
  fallback: "low" | "medium" | "high",
): "low" | "medium" | "high" {
  return raw === "low" || raw === "medium" || raw === "high" ? raw : fallback;
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
    return effortFrom(process.env.ANTHROPIC_EFFORT, "medium");
  },
  /**
   * Model a míra přemýšlení zvlášť pro každou fázi rozpadu.
   *
   * Fáze nejsou stejně těžké a nesmí stát stejně. Rozpad cíle na nejvyšší
   * úroveň je to, co zákazník kupuje — tam se nešetří. Převod hotového
   * týdenního milníku na sedm dní úkolů je proti tomu mechanická práce,
   * a je jí nejvíc: každý týden běžícího cíle znamená jedno volání. Tam
   * se rozhoduje, jestli je provoz udržitelný.
   *
   * Přenastavitelné z prostředí, aby šlo měnit kvalitu i cenu bez buildu.
   */
  get aiBlocksModel(): string {
    return process.env.AI_BLOCKS_MODEL || "claude-sonnet-5";
  },
  get aiBlocksEffort(): "low" | "medium" | "high" {
    return effortFrom(process.env.AI_BLOCKS_EFFORT, "medium");
  },
  get aiDaysModel(): string {
    return process.env.AI_DAYS_MODEL || "claude-sonnet-5";
  },
  get aiDaysEffort(): "low" | "medium" | "high" {
    return effortFrom(process.env.AI_DAYS_EFFORT, "low");
  },
  get demoRateLimitPerHour(): number {
    return optionalInt("DEMO_RATE_LIMIT_PER_HOUR", 15);
  },
  /**
   * Měsíční strop spotřeby AI na uživatele, v korunách (zadání, bod 9).
   *
   * Měření dalo 12–15 Kč za cíl a měsíc, a aplikace povoluje pět cílů
   * naráz — pět aktivních cílů tedy vyjde na 60–75 Kč. Strop je nad tím
   * schválně s rezervou: má chytat útok, ne aktivního zákazníka. Ze 179 Kč
   * zbývá po provizi zhruba 133 Kč, takže i v krajním případě neproděláme.
   */
  get aiMonthlyCapCzk(): number {
    return optionalInt("AI_MONTHLY_CAP_CZK", 100);
  },
  /** Od kolika korun uživatele upozorníme, že se blíží ke stropu. */
  get aiMonthlyWarnCzk(): number {
    return optionalInt("AI_MONTHLY_WARN_CZK", 70);
  },
  /**
   * Kolik nových plánů smí uživatel za měsíc vygenerovat.
   *
   * Tohle je limit, který zákazník zná — je napsaný v ceníku i v podmínkách
   * a aplikace mu ukazuje, kolik z něj spotřeboval. Strop v korunách výš je
   * proti němu jen tichá pojistka: při pěti běžících cílech a deseti nových
   * plánech vyjde nejhorší měsíc na zhruba 80 Kč, takže se k němu poctivé
   * použití nedostane.
   */
  get monthlyPlanAllowance(): number {
    return optionalInt("MONTHLY_PLAN_ALLOWANCE", 10);
  },
  /** Kolik cílů smí běžet najednou. Nad tím se den nedá poctivě rozvrhnout. */
  get maxActiveGoals(): number {
    return optionalInt("MAX_ACTIVE_GOALS", 5);
  },
  /**
   * E-maily s přístupem do správy, oddělené čárkou.
   *
   * Schválně z prostředí, ne z databáze. Kdyby byl příznak správce jen
   * sloupcem, stačila by jedna chyba v API nebo jeden nalezený SQL průlom
   * k tomu, aby si někdo správce udělal sám. Takhle je potřeba přístup
   * na server. Přidání správce stojí restart kontejneru — při jednom
   * provozovateli to není žádná daň.
   */
  get adminEmails(): string[] {
    return (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  },
  /**
   * Na kolik platících účtů připadá jeden bezplatný.
   *
   * Není to vynucený limit, jen vodítko — správa podle něj ukazuje, kolik
   * účtů sis podle vlastního pravidla mohla rozdat a kolik jsi jich už
   * rozdala. Rozhodnutí zůstává na tobě.
   */
  get complimentaryPerPayingUsers(): number {
    return optionalInt("COMPLIMENTARY_PER_PAYING", 100);
  },
  get appUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
};
