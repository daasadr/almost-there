/**
 * Chybové klíče, které umí přeložit `plan.errors.*`.
 *
 * Server posílá jen kód, text si skládá klient. Kdyby přišel kód, na který
 * překlad není, next-intl by spadl — proto se všechno neznámé mapuje na
 * obecnou hlášku.
 */
const KNOWN = new Set([
  "goalRequired",
  "goalTooShort",
  "nameTooShort",
  "nameTooLong",
  "goalTooLong",
  "dateRequired",
  "dateTooSoon",
  "dateTooFar",
  "aiFailed",
  // Model odmítl zadání. Není to výpadek, takže se neopakuje.
  "aiRefused",
  "budgetExhausted",
  "planLimitReached",
  "replanTooSoon",
  // Na témže cíli už jeden přepočet běží. Chybělo to tady, takže se to
  // uživateli ukazovalo jako „něco se pokazilo" — tedy rada zkusit to
  // znovu, což je přesně to, co dělat nemá.
  "replanInProgress",
  // Spojení se přerušilo dřív, než server odpověděl. Přepočet přitom
  // běží dál, takže „zkus to znovu" by znamenalo zaplatit ho dvakrát.
  "replanTimedOut",
  "deadlinePassed",
  "tooManyGoals",
  "notSubscribed",
  "generic",
]);

export type PlanErrorKey = string;

export function planErrorKey(value: unknown): PlanErrorKey {
  return typeof value === "string" && KNOWN.has(value) ? value : "generic";
}
