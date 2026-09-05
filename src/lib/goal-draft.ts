import { readStored, removeStored, writeStored } from "@/lib/safe-storage";

/**
 * Rozepsané zadání cíle uložené v prohlížeči.
 *
 * Drží se v `localStorage`, protože Android aplikaci odloženou na pozadí
 * ruší a `sessionStorage` by restart nepřežilo. To ale znamená, že údaje
 * zůstávají i po odhlášení — a s tím se musí počítat.
 *
 * Na společném telefonu doma je to reálná situace, ne teoretická: kdyby
 * se koncept ukazoval komukoliv, kdo se na tom zařízení přihlásí, uviděl
 * by název cíle někoho jiného. Proto je ke konceptu připsané, komu patří,
 * a cizímu se nevydá — rovnou se smaže.
 *
 * Druhá věc je stárnutí. Koncept, ke kterému se nikdo půl roku nevrátil,
 * už není rozdělaná práce, ale zapomenutý zbytek; po měsíci se zahodí sám.
 *
 * Hromadit se nemá co: je to jediný klíč, který se přepisuje na místě,
 * a při založení cíle i při zahození se maže.
 */

const DRAFT_KEY = "almostthere:goalDraft";

/** Po jak dlouhé nečinnosti se koncept zahodí sám. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type GoalDraft = {
  title: string;
  description: string;
  startingPoint: string;
  targetDate: string;
  importance: number;
  color: string;
};

type Envelope = {
  /** Komu koncept patří. Bez shody se nevydá. */
  userId: string;
  savedAt: number;
  data: GoalDraft;
};

export function clearGoalDraft(): void {
  removeStored(DRAFT_KEY);
}

export function saveGoalDraft(userId: string, data: GoalDraft): void {
  const envelope: Envelope = { userId, savedAt: Date.now(), data };
  writeStored(DRAFT_KEY, JSON.stringify(envelope));
}

/**
 * Vrátí koncept, jen když patří tomuhle uživateli a není starý.
 *
 * V ostatních případech ho po sobě rovnou uklidí — cizí ani prošlý
 * koncept nemá důvod v prohlížeči dál ležet.
 */
export function loadGoalDraft(userId: string): GoalDraft | null {
  const raw = readStored(DRAFT_KEY);
  if (!raw) return null;

  try {
    const envelope = JSON.parse(raw) as Partial<Envelope>;

    // Sem spadne i starší formát bez údaje o vlastníkovi. Komu patřil,
    // se zpětně zjistit nedá, takže se s ním zachází jako s cizím.
    if (envelope.userId !== userId) {
      clearGoalDraft();
      return null;
    }

    if (
      typeof envelope.savedAt !== "number" ||
      Date.now() - envelope.savedAt > MAX_AGE_MS
    ) {
      clearGoalDraft();
      return null;
    }

    return envelope.data ?? null;
  } catch {
    // Poškozený obsah není k ničemu a jen by překážel.
    clearGoalDraft();
    return null;
  }
}

/** Má uživatel rozepsaný cíl, který stojí za připomenutí? */
export function hasGoalDraft(draft: GoalDraft | null): boolean {
  // Prázdný koncept vzniká i pouhým otevřením formuláře. Připomínat, že
  // „máš rozepsaný cíl“, když člověk jen nakoukl a odešel, by bylo otravné.
  return Boolean(draft && (draft.title.trim() || draft.description.trim()));
}
