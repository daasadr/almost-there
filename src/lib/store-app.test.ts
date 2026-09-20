import { describe, expect, it } from "vitest";
import { isStoreApp, STORE_APP_MARKER } from "./store-app";

/**
 * Rozpoznání aplikace z obchodu.
 *
 * Podle něj se schovává všechno, co vede k placení mimo obchod —
 * pravidlo Google Play, jehož porušení znamená stažení aplikace.
 * Kdyby rozpoznání přestalo fungovat, nic nespadne a nikdo si toho
 * nevšimne; projeví se to až zamítnutím.
 */

const headers = (userAgent: string) => new Headers({ "user-agent": userAgent });

describe("isStoreApp", () => {
  it("pozná podpis aplikace v hlavičce prohlížeče", () => {
    expect(
      isStoreApp(headers(`Mozilla/5.0 (Linux; Android 15) ${STORE_APP_MARKER}/1.0 (store)`)),
    ).toBe(true);
  });

  it("běžný prohlížeč aplikací z obchodu není", () => {
    expect(
      isStoreApp(headers("Mozilla/5.0 (Windows NT 10.0) Chrome/140.0")),
    ).toBe(false);
  });

  it("chybějící hlavička neznamená aplikaci z obchodu", () => {
    // Opatrnost na správnou stranu: kdo se nepředstaví, je web, kde
    // se platit smí. Opačná chyba by placení schovala i na webu.
    expect(isStoreApp(new Headers())).toBe(false);
  });
});
