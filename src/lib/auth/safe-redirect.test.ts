import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safe-redirect";

/**
 * Otevřené přesměrování.
 *
 * Tyhle testy vznikly po bezpečnostním review, které našlo, že
 * předchozí kontrola („začíná lomítkem a ne dvěma") se dá obejít.
 * Každý případ níž je buď útok, který projít nesmí, nebo běžná adresa,
 * která projít musí — a pár z nich vypadá na první pohled stejně.
 */

const HOME = "/cs/app";
const BS = String.fromCharCode(92);

describe("bezpečné přesměrování", () => {
  it("pustí vlastní cestu", () => {
    expect(safeRedirect("/cs/visionboard/activate", HOME)).toBe(
      "/cs/visionboard/activate",
    );
  });

  it("zachová parametry", () => {
    expect(safeRedirect("/cs/app?goal=abc", HOME)).toBe("/cs/app?goal=abc");
  });

  it("odmítne adresu bez protokolu", () => {
    expect(safeRedirect("//evil.com", HOME)).toBe(HOME);
  });

  /**
   * Tenhle případ prošel staré kontrole a kvůli němu to celé vzniklo.
   * Prohlížeč zpětné lomítko překládá na obyčejné, takže `/\evil.com`
   * čte jako `//evil.com` a odejde na cizí doménu.
   */
  it("odmítne zpětné lomítko", () => {
    expect(safeRedirect(`/${BS}evil.com`, HOME)).toBe(HOME);
    expect(safeRedirect(`${BS}${BS}evil.com`, HOME)).toBe(HOME);
  });

  it("odmítne celou cizí adresu", () => {
    expect(safeRedirect("https://evil.com/login", HOME)).toBe(HOME);
    expect(safeRedirect("http://evil.com", HOME)).toBe(HOME);
  });

  it("odmítne javascript:", () => {
    expect(safeRedirect("javascript:alert(1)", HOME)).toBe(HOME);
  });

  it("odmítne data:", () => {
    expect(safeRedirect("data:text/html,<script>", HOME)).toBe(HOME);
  });

  /** Zakódované lomítko zůstává součástí cesty, ven nevede. */
  it("pustí zakódované lomítko v cestě", () => {
    expect(safeRedirect("/cs/app%2Ffoo", HOME)).toBe("/cs/app%2Ffoo");
  });

  it("bez hodnoty vrátí náhradu", () => {
    expect(safeRedirect(undefined, HOME)).toBe(HOME);
    expect(safeRedirect("", HOME)).toBe(HOME);
    expect(safeRedirect(null, HOME)).toBe(HOME);
  });

  it("zahodí kotvu, ta se na server stejně nedostane", () => {
    expect(safeRedirect("/cs/app#tajne", HOME)).toBe("/cs/app");
  });
});
