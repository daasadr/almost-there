import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { planErrorKey } from "./errors";

/**
 * Seznam známých chyb a překlady se musí krýt.
 *
 * Tenhle test vznikl z chyby, kterou nahlásila uživatelka: „dohnat
 * skluz" prý vždycky selže. Server přitom posílal `replanInProgress`,
 * tedy „přepočet už běží, počkej" — jenže ten kód v seznamu známých
 * chyb chyběl, takže se z něj stalo obecné „něco se pokazilo, zkus to
 * znovu". Rada opakovat něco, co právě běží, je přesně naopak.
 *
 * Obě strany se kontrolují v obou směrech. Kód bez překladu by appku
 * shodil, překlad bez kódu je hláška, kterou nikdo nikdy neuvidí —
 * a to druhé je zrádnější, protože se nijak neprojeví.
 */

const LOCALES = ["cs", "en", "de"] as const;

function errorKeys(locale: string): string[] {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
  return Object.keys(messages.plan.errors);
}

describe("plan.errors", () => {
  it.each(LOCALES)("%s má překlad ke každému známému kódu", (locale) => {
    const translated = new Set(errorKeys(locale));

    for (const key of errorKeys("cs")) {
      expect(translated, `chybí ${locale}: plan.errors.${key}`).toContain(key);
    }
  });

  it("každá hláška patří ke kódu, který klient zná", () => {
    for (const key of errorKeys("cs")) {
      expect(
        planErrorKey(key),
        `plan.errors.${key} existuje, ale KNOWN v errors.ts ho nezná — ` +
          `ukáže se místo něj obecná hláška`,
      ).toBe(key);
    }
  });

  it("neznámý kód spadne na obecnou hlášku místo pádu", () => {
    expect(planErrorKey("cosiNovehoZeServeru")).toBe("generic");
    expect(planErrorKey(undefined)).toBe("generic");
    expect(planErrorKey(42)).toBe("generic");
  });
});
