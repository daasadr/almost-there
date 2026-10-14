import { describe, expect, it } from "vitest";
import {
  challengeFor,
  codeFromBytes,
  formatCode,
  generateCode,
  isValidChallenge,
  isValidState,
  normalizeCode,
} from "./activation";

/**
 * Čisté části vydávání aktivačního kódu.
 *
 * `issueActivationCode` a `consumeActivationCode` sahají do databáze
 * a testují se až s API (úkol 2.1). Tady je to, co jde ověřit samo
 * o sobě — a zrovna u toho se dá udělat tichá chyba, která se při
 * běžném používání nepozná.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

describe("abeceda kódu", () => {
  const CODE = /^[ABCDEFGHJKMNPQRSTVWXYZ23456789]{12}$/;

  it("má dvanáct znaků z dohodnuté abecedy", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateCode()).toMatch(CODE);
    }
  });

  it("neobsahuje znaky, které se pletou", () => {
    const thousand = Array.from({ length: 1000 }, generateCode).join("");
    for (const confusing of ["I", "L", "O", "U", "0", "1"]) {
      expect(thousand).not.toContain(confusing);
    }
  });

  it("nedává stejný kód dvakrát", () => {
    const codes = new Set(Array.from({ length: 500 }, generateCode));
    expect(codes.size).toBe(500);
  });

  /**
   * Hlídá zkreslení z `bajt % 30`.
   *
   * 256 není dělitelné třiceti, takže při naivním losování by prvních
   * šestnáct znaků padalo zhruba o sedm procent častěji. Na hotových
   * kódech se to dá hledat jen statisticky — a takový test je buď
   * slabý, nebo občas spadne sám od sebe. Zkoušel jsem to a spadl:
   * u třiceti znaků se jeden výkyv přes tři sigma trefí zhruba každý
   * pětadvacátý běh.
   *
   * Proto se místo vzorku zkouší samotný převod nad určenou řadou bajtů.
   */
  it("zahazuje bajty, které by zkreslovaly", () => {
    // 240 až 255 nesmí projít. 239 je poslední, který smí.
    expect(codeFromBytes([240, 241, 250, 255])).toBe("");
    expect(codeFromBytes([239])).toBe(ALPHABET[239 % 30]);
  });

  it("mapuje přijaté bajty na abecedu po pořádku", () => {
    expect(codeFromBytes([0, 1, 29, 30, 31])).toBe(
      ALPHABET[0] + ALPHABET[1] + ALPHABET[29] + ALPHABET[0] + ALPHABET[1],
    );
  });

  it("nikdy nevrátí víc než dvanáct znaků", () => {
    expect(codeFromBytes(Array.from({ length: 100 }, (_, i) => i))).toHaveLength(
      12,
    );
  });
});

describe("tvar kódu pro oči a pro stroj", () => {
  it("rozdělí po čtyřech", () => {
    expect(formatCode("ABCDEFGHJKMN")).toBe("ABCD-EFGH-JKMN");
  });

  it("srovná, co člověk opíše", () => {
    expect(normalizeCode("abcd-efgh jkmn")).toBe("ABCDEFGHJKMN");
    expect(normalizeCode("ABCD EFGH-JKMN")).toBe("ABCDEFGHJKMN");
  });

  it("zahodí znaky, které v abecedě nejsou", () => {
    expect(normalizeCode("ABCD-EFGH-JKM0")).toBe("ABCDEFGHJKM");
  });
});

describe("PKCE", () => {
  /** Vektor z kontraktu, oddíl 9. Tentýž používá Vision Board. */
  it("spočítá challenge jako druhá strana", () => {
    expect(challengeFor("BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc")).toBe(
      "3Ev4DHdHPRMPoN6GukAY_pi7IUAF5qWJHRK6kURvnoE",
    );
  });

  it("jiné tajemství dá jiný otisk", () => {
    expect(challengeFor("a")).not.toBe(challengeFor("b"));
  });
});

describe("kontrola parametrů z adresy", () => {
  const VALID = "3Ev4DHdHPRMPoN6GukAY_pi7IUAF5qWJHRK6kURvnoE";

  it("přijme challenge správné délky", () => {
    expect(isValidChallenge(VALID)).toBe(true);
  });

  it("odmítne jinou délku", () => {
    expect(isValidChallenge(VALID.slice(0, 42))).toBe(false);
    expect(isValidChallenge(`${VALID}x`)).toBe(false);
  });

  it("odmítne znaky mimo base64url", () => {
    expect(isValidChallenge(`${VALID.slice(0, 42)}+`)).toBe(false);
    expect(isValidChallenge(`${VALID.slice(0, 42)}=`)).toBe(false);
  });

  it("přijme rozumný state a odmítne nesmysl", () => {
    expect(isValidState("abc-123_XYZ")).toBe(true);
    expect(isValidState("")).toBe(false);
    expect(isValidState("x".repeat(65))).toBe(false);
    expect(isValidState("<script>")).toBe(false);
  });
});
