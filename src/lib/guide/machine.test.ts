import { describe, expect, it } from "vitest";
import {
  dismissHint,
  initial,
  mayHint,
  reasonToHint,
  reduce,
  showHint,
  type GuideEvent,
  type GuideState,
} from "./machine";
import {
  ARRIVAL_MS,
  COOLDOWN_MS,
  HINT_MS,
  HOVER_THRESHOLD,
  MAX_HINTS,
  SILENCE_MS,
} from "./rules";

/**
 * Automat návštěvy.
 *
 * Tohle je to, co drží slib, že navádění je pomoc a ne reklama uvnitř
 * vlastního webu. Čtyři vlastnosti z návodu — zhasne samo, je ho málo,
 * nenapovídá při příchodu ani do čtení — nejsou doporučení, takže se
 * zkoušejí všechny.
 *
 * Automat je čistý, takže jdou prohnat i posloupnosti, které by se
 * v prohlížeči klikaly půl hodiny.
 */

/** Prožene stav řadou událostí. */
function play(events: GuideEvent[], from = initial()): GuideState {
  return events.reduce(reduce, from);
}

describe("stavy", () => {
  it("po příchodu se mlčí, i když se člověk hýbe", () => {
    const state = play([
      { type: "move", at: 500 },
      { type: "move", at: 1_500 },
      { type: "hover", at: 2_000 },
      { type: "hover", at: 2_500 },
      { type: "hover", at: 3_000 },
    ]);

    expect(state.phase).toBe("arriving");
    expect(mayHint(state)).toBe(false);
    expect(reasonToHint(state)).toBeNull();
  });

  it("po uplynutí příchodu se rozhlíží", () => {
    const state = play([{ type: "move", at: ARRIVAL_MS + 100 }]);
    expect(state.phase).toBe("browsing");
  });

  it("opakované přejezdy bez klepnutí znamenají hledání", () => {
    const state = play([
      { type: "move", at: ARRIVAL_MS + 100 },
      ...Array.from({ length: HOVER_THRESHOLD }, (_, i) => ({
        type: "hover" as const,
        at: ARRIVAL_MS + 200 + i * 100,
      })),
    ]);

    expect(state.phase).toBe("searching");
    expect(reasonToHint(state)).toBe("hover");
  });

  it("klepnutí znamená rozhodnuto — váhání se nuluje", () => {
    const state = play([
      { type: "move", at: ARRIVAL_MS + 100 },
      { type: "hover", at: ARRIVAL_MS + 200 },
      { type: "hover", at: ARRIVAL_MS + 300 },
      { type: "hover", at: ARRIVAL_MS + 400 },
      { type: "click", at: ARRIVAL_MS + 500 },
    ]);

    expect(state.phase).toBe("browsing");
    expect(state.hovers).toBe(0);
    expect(reasonToHint(state)).toBeNull();
  });

  it("do čtení se nenapovídá", () => {
    const state = play([
      { type: "move", at: ARRIVAL_MS + 100 },
      { type: "scrollEnd", at: ARRIVAL_MS + 200 },
      { type: "engage", at: ARRIVAL_MS + 300 },
    ]);

    expect(state.phase).toBe("reading");
    expect(mayHint(state)).toBe(false);
  });

  it("otevření něčeho zhasne nápovědu, která byla vidět", () => {
    let state = play([
      { type: "move", at: ARRIVAL_MS + 100 },
      { type: "scrollEnd", at: ARRIVAL_MS + 200 },
    ]);
    state = showHint(state, "demo", "scrollEnd");
    expect(state.hint).not.toBeNull();

    state = reduce(state, { type: "engage", at: ARRIVAL_MS + 400 });
    expect(state.hint).toBeNull();
  });
});

describe("ticho", () => {
  /*
   * Ticho samo o sobě nic neznamená — člověk si odskočil pro kafe.
   * Napovídá se až po tichu, kterému předcházela aktivita.
   */
  it("ticho bez předchozí aktivity nenapovídá", () => {
    const state = play([{ type: "tick", at: ARRIVAL_MS + SILENCE_MS + 1_000 }]);
    expect(reasonToHint(state)).toBeNull();
  });

  it("ticho po aktivitě napovídá", () => {
    const start = ARRIVAL_MS + 100;
    const state = play([
      { type: "move", at: start },
      { type: "scrollEnd", at: start + 100 },
      { type: "tick", at: start + 100 + SILENCE_MS },
    ]);

    expect(reasonToHint(state)).toBe("silence");
  });

  /*
   * Odchod na jinou kartu není váhání. Bez tohohle by se po návratu
   * spustila nápověda z „ticha", které bylo jen tím, že se nedíval —
   * a naskočila by hned, což vypadá jako past.
   */
  it("čas strávený na jiné kartě se nepočítá za ticho", () => {
    const start = ARRIVAL_MS + 100;
    const state = play([
      { type: "move", at: start },
      { type: "scrollEnd", at: start + 100 },
      { type: "hidden", at: start + 200 },
      { type: "visible", at: start + 200 + 10 * SILENCE_MS },
    ]);

    expect(reasonToHint(state)).toBeNull();
  });
});

describe("kolik a jak často", () => {
  /** Dovede stav do bodu, kdy se smí napovídat. */
  function ready(at: number, from = initial()): GuideState {
    return play(
      [
        { type: "move", at },
        { type: "scrollEnd", at: at + 100 },
        { type: "tick", at: at + 100 + SILENCE_MS },
      ],
      from,
    );
  }

  it("nápověda zhasne sama, bez zásahu", () => {
    let state = showHint(ready(ARRIVAL_MS + 100), "demo", "silence");
    const shownAt = state.now;

    state = reduce(state, { type: "tick", at: shownAt + HINT_MS });
    expect(state.hint).toBeNull();
  });

  it("hned po nápovědě se mlčí", () => {
    let state = showHint(ready(ARRIVAL_MS + 100), "demo", "silence");
    state = reduce(state, { type: "tick", at: state.now + HINT_MS });

    state = ready(state.now + 1_000, state);
    expect(reasonToHint(state)).toBeNull();
  });

  it("po uplynutí klidu se smí znovu", () => {
    let state = showHint(ready(ARRIVAL_MS + 100), "demo", "silence");
    state = reduce(state, { type: "tick", at: state.now + HINT_MS });

    state = ready(state.now + COOLDOWN_MS + 1_000, state);
    expect(reasonToHint(state)).not.toBeNull();
  });

  /*
   * Kdo se celou dobu hýbe, nikdy nedostane nápovědu z ticha —
   * nemá ho kde vzít. Je to vlastnost, ne mezera: nápověda patří
   * tomu, kdo se zastavil, ne tomu, kdo je v jednom kole.
   */
  it("nepřetržitá aktivita nápovědu nespustí", () => {
    let state = initial();

    for (let at = 0; at < 10 * 60 * 1000; at += 500) {
      state = reduce(state, { type: "move", at });
      state = reduce(state, { type: "tick", at: at + 1 });
      expect(reasonToHint(state)).toBeNull();
    }
  });

  /*
   * Záplava střídání aktivity a ticha nesmí strop obejít. Tohle je ta
   * vlastnost, kvůli které se z navádění nestane otravování — a
   * v prohlížeči by se zkoušela hodinu.
   */
  it("strop za návštěvu platí i při záplavě", () => {
    let state = initial();
    let shown = 0;

    for (let at = ARRIVAL_MS; at < 2 * 60 * 60 * 1000; at += SILENCE_MS + 100) {
      state = reduce(state, { type: "move", at });
      state = reduce(state, { type: "scrollEnd", at: at + 1 });
      state = reduce(state, { type: "tick", at: at + 1 + SILENCE_MS });

      const reason = reasonToHint(state);
      if (reason) {
        state = showHint(state, "demo", reason);
        shown += 1;
        // Nápověda sama zhasne, ať se smyčka hne dál.
        state = reduce(state, { type: "tick", at: state.now + HINT_MS });
      }
    }

    expect(shown).toBe(MAX_HINTS);
    expect(state.hintsShown).toBe(MAX_HINTS);
  });

  it("dvě nápovědy nejsou vidět naráz", () => {
    let state = showHint(ready(ARRIVAL_MS + 100), "demo", "silence");
    expect(mayHint(state)).toBe(false);

    state = ready(state.now + 1_000, state);
    expect(reasonToHint(state)).toBeNull();
  });

  it("zhasnutí rukou spustí klid, ne další nápovědu", () => {
    let state = showHint(ready(ARRIVAL_MS + 100), "demo", "silence");
    state = dismissHint(state);

    expect(state.hint).toBeNull();
    expect(state.lastHintAt).toBe(state.now);
    expect(mayHint(state)).toBe(false);
  });
});
