import { describe, expect, it } from "vitest";
import { decideRenew, RENEW_STATUS, type RenewFacts } from "./renew";

/**
 * Rozhodnutí o obnově licence.
 *
 * Aplikace podle těchhle kódů pozná, co má dělat: u `invalid_license`
 * zkusit znovu nebo nahlásit chybu, u `revoked` licenci zahodit a
 * nabídnout novou aktivaci. Záměna z toho udělá aplikaci, která buď
 * marně opakuje, nebo odemčené zahodí.
 */

function facts(over: Partial<RenewFacts> = {}): RenewFacts {
  return {
    claims: { sub: "u1", iid: "i1" },
    installationActive: true,
    accountUsable: true,
    ...over,
  };
}

describe("rozhodnutí o obnově", () => {
  it("platná licence na aktivním zařízení projde", () => {
    expect(decideRenew(facts())).toEqual({ ok: true });
  });

  it("cizí nebo poškozený podpis", () => {
    expect(decideRenew(facts({ claims: null }))).toEqual({
      ok: false,
      error: "invalid_license",
    });
  });

  it("odebrané zařízení je revoked", () => {
    expect(decideRenew(facts({ installationActive: false }))).toEqual({
      ok: false,
      error: "revoked",
    });
  });

  it("smazaný účet je taky revoked", () => {
    expect(decideRenew(facts({ accountUsable: false }))).toEqual({
      ok: false,
      error: "revoked",
    });
  });

  /**
   * Zaniklý účet a odebrané zařízení se nerozlišují schválně. Jinak by
   * cizí držitel tokenu zjistil, jestli účet ještě existuje — a aplikaci
   * to k ničemu není, v obou případech má udělat totéž.
   */
  it("odebrané zařízení a zaniklý účet vypadají stejně", () => {
    const device = decideRenew(facts({ installationActive: false }));
    const account = decideRenew(facts({ accountUsable: false }));
    expect(device).toEqual(account);
  });

  it("neplatná licence má přednost před stavem účtu", () => {
    expect(
      decideRenew(facts({ claims: null, accountUsable: false })),
    ).toEqual({ ok: false, error: "invalid_license" });
  });
});

describe("stavy HTTP", () => {
  it("odpovídají kontraktu", () => {
    expect(RENEW_STATUS).toEqual({
      invalid_request: 400,
      invalid_license: 400,
      revoked: 403,
    });
  });
});
