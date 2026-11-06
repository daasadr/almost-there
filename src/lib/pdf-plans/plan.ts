/**
 * Tvar hotového plánu, jak se ukládá a jak se z něj sází PDF.
 *
 * Čistý popis bez závislostí na databázi i na modelu, protože z něj
 * vychází dvě různé věci: vysázené PDF a — po předplacení — skutečný
 * cíl v aplikaci. Kdyby si každá z nich četla data po svém, vytištěný
 * plán by se s tím v aplikaci rozešel.
 */

export type PlanTask = {
  title: string;
  estimatedMinutes: number;
};

export type PlanDay = {
  /** RRRR-MM-DD. */
  date: string;
  /** Čím je ten den daný, jedna věta. */
  summary: string;
  tasks: PlanTask[];
};

export type PlanWeek = {
  /** Pořadí od jedné. */
  index: number;
  title: string;
  /** Co musí na konci týdne platit. */
  milestone: string;
  startDate: string;
  endDate: string;
  /** Prázdné, dokud se týden nerozepsal na dny. */
  days: PlanDay[];
};

export type StoredPlan = {
  /** Jak model cíl pochopil. V PDF je to hned pod nadpisem. */
  restatement: string;
  assumptions: string[];
  /** Čím se cíl prokáže. Nepovinné — model ji občas vynechá. */
  finalChallenge?: string;
  feasibility: string;
  feasibilityNote: string;
  weeks: PlanWeek[];
};

/** Který týden ještě nemá rozepsané dny. Prázdno, když je hotovo. */
export function nextUnplannedWeek(plan: StoredPlan): PlanWeek | undefined {
  return plan.weeks.find((week) => week.days.length === 0);
}

/** Je plán hotový? Hotový znamená, že každý týden má aspoň jeden den. */
export function isComplete(plan: StoredPlan): boolean {
  return plan.weeks.length > 0 && nextUnplannedWeek(plan) === undefined;
}

/**
 * Kolik kol ještě zbývá. Pro ukazatel průběhu, aby člověk po zaplacení
 * nekoukal na neurčité kolečko a nemyslel si, že se nic neděje.
 */
export function progress(plan: StoredPlan | null): {
  done: number;
  total: number;
} {
  if (!plan) return { done: 0, total: 1 };

  const total = plan.weeks.length;
  const done = plan.weeks.filter((week) => week.days.length > 0).length;
  return { done, total };
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
    return Array.isArray(value?.weeks) ? value : null;
  } catch {
    return null;
  }
}
