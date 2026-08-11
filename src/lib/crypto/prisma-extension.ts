import "server-only";
import { Prisma } from "@/generated/prisma";
import { decryptField, encryptField, isEncrypted } from "./field";

/**
 * Průhledné šifrování obsahu při zápisu a rozšifrování při čtení.
 *
 * Je to rozšíření Prismy, ne pomocná funkce volaná ručně. Kdyby to bylo
 * na volajících, dřív nebo později by někdo někde zapomněl — a nepoznalo
 * by se to, protože nezašifrovaná data se čtou úplně stejně.
 *
 * Dvě rozhodnutí, na kterých to celé stojí:
 *
 * 1. Šifruje se podle NÁZVU pole, ne podle modelu. Vnořené zápisy
 *    (cíl i s obdobími a úkoly jedním voláním) tak fungují samy od sebe —
 *    nemusíme rozplétat, který kus stromu patří kterému modelu.
 *
 * 2. Rozšifrování se řídí značkou v hodnotě, ne seznamem polí. Když by
 *    se někde zapomnělo zašifrovat, data zůstanou čitelná a nic se
 *    nerozbije. Opačné pořadí by znamenalo, že se uživateli ukáže změť
 *    znaků — a to je mnohem horší selhání než sloupec navíc v otevřené
 *    podobě.
 */

/**
 * Pole, jejichž obsah vypovídá o životě uživatele.
 *
 * Schválně tu nejsou e-maily ani jména: podle nich se vyhledává a
 * páruje, takže by je šifrování rozbilo. Chrání se to, co je citlivé
 * a zároveň se na to nikdy nedotazujeme — text cílů, plánů a úkolů.
 */
const ENCRYPTED_FIELDS = new Set([
  "title",
  "description",
  "summary",
  "restatement",
  "assumptions",
  "feasibilityNote",
  "completionNote",
  "rewardText",
  // Co má uživatel rád a co ne — osobní údaj jako obsah cílů.
  "rewardLikes",
  "rewardDislikes",
  // Proč úkol nešlo splnit — uživatel to píše vlastními slovy.
  "deferReason",
  "note",
  "alt",
]);

/** Části dotazu, ve kterých se zapisuje. Zbytek (where, select, orderBy)
 *  se nesmí dotknout — tam by šifrování jen rozbilo hledání. */
const WRITE_KEYS = new Set(["data", "create", "update", "createMany"]);

/** Operace, které do databáze zapisují. */
const WRITE_OPERATIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "upsert",
]);

/** Zašifruje hodnoty citlivých polí kdekoliv v zapisovaném podstromu. */
function encryptWritePayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(encryptWritePayload);

  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value;

  const result: Record<string, unknown> = {};

  for (const [field, inner] of Object.entries(value)) {
    if (!ENCRYPTED_FIELDS.has(field)) {
      result[field] = encryptWritePayload(inner);
      continue;
    }

    if (typeof inner === "string") {
      result[field] = encryptField(inner);
    } else if (Array.isArray(inner)) {
      // Například `assumptions: ["…", "…"]`.
      result[field] = inner.map((item) =>
        typeof item === "string" ? encryptField(item) : item,
      );
    } else if (inner && typeof inner === "object") {
      // Zápisy typu `{ set: [...] }` u seznamů.
      result[field] = encryptWritePayload(inner);
    } else {
      result[field] = inner;
    }
  }

  return result;
}

/** Rozšifruje cokoliv, co nese značku, kdekoliv ve výsledku. */
function decryptResult(value: unknown): unknown {
  if (typeof value === "string") {
    return isEncrypted(value) ? decryptField(value) : value;
  }

  if (Array.isArray(value)) return value.map(decryptResult);

  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value;

  const result: Record<string, unknown> = {};
  for (const [field, inner] of Object.entries(value)) {
    result[field] = decryptResult(inner);
  }
  return result;
}

export const encryptionExtension = Prisma.defineExtension({
  name: "fieldEncryption",
  query: {
    $allModels: {
      async $allOperations({ operation, args, query }) {
        let effective = args;

        if (WRITE_OPERATIONS.has(operation) && args && typeof args === "object") {
          const next: Record<string, unknown> = { ...args };
          for (const [part, value] of Object.entries(next)) {
            if (WRITE_KEYS.has(part)) next[part] = encryptWritePayload(value);
          }
          effective = next as typeof args;
        }

        return decryptResult(await query(effective));
      },
    },
  },
});
