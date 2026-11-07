/**
 * Tvar hotového plánu, jak se ukládá a jak se z něj sází PDF.
 *
 * Čistý popis bez závislostí na databázi i na modelu, protože z něj
 * vychází dvě různé věci: vysázené PDF a — po předplacení — skutečný
 * cíl v aplikaci. Kdyby si každá z nich četla data po svém, vytištěný
 * plán by se s tím v aplikaci rozešel.
 *
 * ── Dvě podrobnosti, jedna struktura ────────────────────────────────
 *
 * Ne každý cíl se vyplatí rozepisovat na dny. U maturity ano: v úterý
 * se čte kapitola, ve čtvrtek se počítají příklady. U svatby ne —
 * tam je otázka „co je potřeba zařídit tenhle týden", a rozpis po
 * dnech by jen předstíral přesnost, kterou nikdo nedodrží.
 *
 * Obojí má ale stejný tvar: **období**, a v něm **oddíly** s úkoly.
 *
 *  - podrobnost `daily`  — období je týden, oddíl je den,
 *  - podrobnost `weekly` — období je měsíc, oddíl je týden.
 *
 * Díky tomu je sazba, ukládání i počítání průběhu jedno a totéž
 * a liší se jen to, jak se oddíl nadepíše.
 */

export type Granularity = "daily" | "weekly";

export type PlanTask = {
  title: string;
  estimatedMinutes: number;
};

/** Den u podrobného plánu, týden u toho týdenního. */
export type PlanSlot = {
  /** RRRR-MM-DD. U dne je shodné s `endDate`. */
  startDate: string;
  endDate: string;
  /** Čím je ten úsek daný, jedna věta. */
  summary: string;
  tasks: PlanTask[];
};

export type PlanPeriod = {
  /** Pořadí od jedné. */
  index: number;
  title: string;
  /** Co musí na konci období platit. */
  milestone: string;
  startDate: string;
  endDate: string;
  /** Prázdné, dokud se období nerozepsalo. */
  slots: PlanSlot[];
};

export type StoredPlan = {
  granularity: Granularity;
  /** Jak model cíl pochopil. V PDF je to hned pod nadpisem. */
  restatement: string;
  assumptions: string[];
  /** Čím se cíl prokáže. Nepovinné — model ji občas vynechá. */
  finalChallenge?: string;
  feasibility: string;
  feasibilityNote: string;
  periods: PlanPeriod[];
};

/** Které období ještě není rozepsané. Prázdno, když je hotovo. */
export function nextUnplannedPeriod(plan: StoredPlan): PlanPeriod | undefined {
  return plan.periods.find((period) => period.slots.length === 0);
}

/** Hotový znamená, že každé období má aspoň jeden oddíl. */
export function isComplete(plan: StoredPlan): boolean {
  return plan.periods.length > 0 && nextUnplannedPeriod(plan) === undefined;
}

/**
 * Kolik je hotovo. Pro ukazatel průběhu, aby člověk po zaplacení
 * nekoukal na neurčité kolečko a nemyslel si, že se nic neděje.
 */
export function progress(plan: StoredPlan | null): {
  done: number;
  total: number;
} {
  if (!plan) return { done: 0, total: 1 };

  return {
    done: plan.periods.filter((period) => period.slots.length > 0).length,
    total: plan.periods.length,
  };
}

/**
 * Přečte uložený plán. Vrací prázdno místo výjimky.
 *
 * Sloupec je šifrovaný text, takže poškodit se dá i jinak než špatným
 * JSONem — třeba výměnou klíče. Spadnout na tom má stránka s plánem,
 * ne celý výpis cílů.
 */
export function parsePlan(json: string | null): StoredPlan | null {
  if (!json) return null;

  try {
    const value = JSON.parse(json) as StoredPlan;
    return Array.isArray(value?.periods) ? value : null;
  } catch {
    return null;
  }
}
