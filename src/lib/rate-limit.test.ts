import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getClientIp, hashIp } from "./rate-limit";

/**
 * Počítadlo pokusů a zjištění adresy klienta.
 *
 * Testy chyběly, přestože na tomhle stojí ochrana placeného klíče k AI
 * i aktivace Vision Boardu. Nejcennější je tu `getClientIp`: čte
 * z `X-Forwarded-For` **poslední** hodnotu, ne první, a kdyby to někdo
 * při úklidu obrátil, přestaly by všechny limity platit — aniž by se
 * cokoliv rozbilo nebo spadlo.
 *
 * Klíče jsou v každém testu jiné, protože počítadlo žije v paměti
 * modulu a mezi testy se nevynuluje.
 */

afterEach(() => {
  vi.useRealTimers();
});

describe("počítadlo pokusů", () => {
  it("pustí první pokus a odečte z povoleného počtu", () => {
    const result = checkRateLimit("a", 3, 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("zastaví po vyčerpání", () => {
    for (let i = 0; i < 3; i += 1) {
      expect(checkRateLimit("b", 3, 1000).allowed).toBe(true);
    }
    expect(checkRateLimit("b", 3, 1000).allowed).toBe(false);
  });

  it("další zamítnutí počítadlo neposouvá", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("c", 3, 1000);
    const first = checkRateLimit("c", 3, 1000);
    const second = checkRateLimit("c", 3, 1000);
    expect(first.resetAt).toBe(second.resetAt);
  });

  it("po uplynutí okna začíná znovu", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i += 1) checkRateLimit("d", 3, 1000);
    expect(checkRateLimit("d", 3, 1000).allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(checkRateLimit("d", 3, 1000).allowed).toBe(true);
  });

  it("klíče se navzájem neovlivňují", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("e1", 3, 1000);
    expect(checkRateLimit("e1", 3, 1000).allowed).toBe(false);
    expect(checkRateLimit("e2", 3, 1000).allowed).toBe(true);
  });
});

describe("adresa klienta", () => {
  it("bere X-Real-IP, kterou nastavuje náš nginx", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.7" });
    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  /**
   * Tohle je ta podstatná vlastnost.
   *
   * Nginx hlavičku doplňuje, takže když útočník pošle vlastní
   * `X-Forwarded-For: 1.2.3.4`, dorazí k aplikaci jako
   * `1.2.3.4, <skutečná adresa>`. Kdo by četl první položku, počítal by
   * limit na adresu, kterou si útočník vymyslel — a mohl by ji měnit
   * s každým požadavkem.
   */
  it("z X-Forwarded-For bere poslední hodnotu, ne první", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 198.51.100.9",
    });
    expect(getClientIp(headers)).toBe("198.51.100.9");
  });

  it("X-Real-IP má přednost před podvrženým X-Forwarded-For", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.9",
      "x-forwarded-for": "1.2.3.4",
    });
    expect(getClientIp(headers)).toBe("198.51.100.9");
  });

  it("bez hlaviček vrátí neznámo, ne prázdno", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("otisk adresy", () => {
  it("je stejný pro tutéž adresu a jiný pro jinou", () => {
    expect(hashIp("203.0.113.7")).toBe(hashIp("203.0.113.7"));
    expect(hashIp("203.0.113.7")).not.toBe(hashIp("203.0.113.8"));
  });

  it("adresu samotnou neobsahuje", () => {
    expect(hashIp("203.0.113.7")).not.toContain("203");
  });
});
