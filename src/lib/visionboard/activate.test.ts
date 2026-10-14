import { describe, expect, it } from "vitest";
import {
  decideActivation,
  ERROR_STATUS,
  MAX_INSTALLATIONS,
  type ActivationFacts,
} from "./activate";

/**
 * Matice chybových stavů z kontraktu, oddíl 3.4.
 *
 * Druhá strana podle těch kódů skládá hlášky pro uživatele, takže
 * záměna dvou z nich znamená, že se člověku ukáže nesmysl — třeba
 * „zkus to později" u kódu, který prostě vypršel. Projít to nad živou
 * databází by znamenalo šest účtů v šesti stavech; takhle to jde celé
 * a za vteřinu.
 */

function facts(over: Partial<ActivationFacts> = {}): ActivationFacts {
  return {
    code: { ok: true, userId: "u1" },
    accountUsable: true,
    installationKnown: false,
    otherActiveInstallations: 0,
    ...over,
  };
}

describe("rozhodnutí o aktivaci", () => {
  it("platný kód na účtu s místem projde", () => {
    expect(decideActivation(facts())).toEqual({ ok: true });
  });

  it("neplatný kód", () => {
    expect(
      decideActivation(facts({ code: { ok: false, error: "invalid_code" } })),
    ).toEqual({ ok: false, error: "invalid_code" });
  });

  it("prošlý kód se pozná zvlášť", () => {
    expect(
      decideActivation(facts({ code: { ok: false, error: "expired_code" } })),
    ).toEqual({ ok: false, error: "expired_code" });
  });

  it("smazaný účet nárok nemá", () => {
    expect(decideActivation(facts({ accountUsable: false }))).toEqual({
      ok: false,
      error: "no_license",
    });
  });

  it("čtvrté zařízení se odmítne", () => {
    expect(
      decideActivation(facts({ otherActiveInstallations: MAX_INSTALLATIONS })),
    ).toEqual({ ok: false, error: "too_many_installations" });
  });

  it("třetí zařízení ještě projde", () => {
    expect(
      decideActivation(
        facts({ otherActiveInstallations: MAX_INSTALLATIONS - 1 }),
      ),
    ).toEqual({ ok: true });
  });

  /**
   * Bez tohohle by přeinstalace počítače znamenala, že se člověk nemá
   * jak vrátit: zařízení je vedené, místo zabrané, a odebrat ho nejde
   * odnikud jinud než z toho počítače.
   */
  it("známé zařízení projde i při plném počtu", () => {
    expect(
      decideActivation(
        facts({
          installationKnown: true,
          otherActiveInstallations: MAX_INSTALLATIONS,
        }),
      ),
    ).toEqual({ ok: true });
  });

  /**
   * Na kód se odpovídá dřív než na účet. Jinak by cizí člověk s
   * vymyšleným kódem zjistil, jestli daný účet licenci má.
   */
  it("špatný kód má přednost před chybějícím nárokem", () => {
    expect(
      decideActivation(
        facts({
          code: { ok: false, error: "invalid_code" },
          accountUsable: false,
        }),
      ),
    ).toEqual({ ok: false, error: "invalid_code" });
  });
});

describe("stavy HTTP", () => {
  it("odpovídají kontraktu", () => {
    expect(ERROR_STATUS).toEqual({
      invalid_request: 400,
      invalid_code: 400,
      expired_code: 400,
      no_license: 403,
      too_many_installations: 403,
    });
  });
});
