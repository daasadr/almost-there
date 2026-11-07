import {
  ARRIVAL_MS,
  COOLDOWN_MS,
  HINT_MS,
  HOVER_THRESHOLD,
  MAX_HINTS,
  SILENCE_MS,
  type Reason,
  type Target,
} from "./rules";

/**
 * Stavový automat návštěvy.
 *
 * Čisté funkce: stav a událost dovnitř, nový stav ven. Žádný DOM,
 * žádné časovače, žádné `window`. Díky tomu se dá celé chování
 * vyzkoušet bez prohlížeče — a to je rozdíl mezi „napsali jsme testy"
 * a „testy něco hlídají".
 *
 * ── Čtyři stavy ─────────────────────────────────────────────────────
 *
 *  - `arriving`  — první vteřiny. Nenapovídá se **nikdy**. Kdo právě
 *    dorazil, se potřebuje rozkoukat.
 *  - `browsing`  — hýbe se po stránce, zatím nic neotevřel.
 *  - `searching` — **tady se napovídá.** Něco se děje, ale nic z toho
 *    nevede k cíli.
 *  - `reading`   — je v něčem ponořený. Nechat být; nápověda do čtení
 *    je vyrušení, i kdyby byla správná.
 *
 * Přechody dělají události, ne čas sám. Čas je taky událost (`tick`),
 * aby šel v testech posouvat ručně.
 */

export type GuideState = {
  phase: "arriving" | "browsing" | "searching" | "reading";
  /** Čas od začátku návštěvy, v milisekundách. */
  now: number;
  /** Kdy se naposledy něco dělo. */
  lastActivity: number;
  /** Kdy naposledy zhasla nápověda. Nula, když žádná nebyla. */
  lastHintAt: number;
  /** Kolik nápověd už padlo. */
  hintsShown: number;
  /** Přejezdy nad klikacími prvky bez klepnutí. */
  hovers: number;
  /** Nápověda, která je právě vidět. */
  hint: { target: Target; reason: Reason; shownAt: number } | null;
};

export type GuideEvent =
  | { type: "tick"; at: number }
  | { type: "move"; at: number }
  | { type: "hover"; at: number }
  | { type: "click"; at: number }
  /** Otevřel něco, co se čte — článek, šablonu, návod. */
  | { type: "engage"; at: number }
  | { type: "scrollEnd"; at: number }
  /** Karta se schovala nebo vrátila. Časovače venku se podle toho staví. */
  | { type: "hidden"; at: number }
  | { type: "visible"; at: number };

export function initial(): GuideState {
  return {
    phase: "arriving",
    now: 0,
    lastActivity: 0,
    lastHintAt: 0,
    hintsShown: 0,
    hovers: 0,
    hint: null,
  };
}

/**
 * Smí se teď napovídat?
 *
 * Vyjmenované schválně jako jedna funkce: je to to nejdůležitější
 * pravidlo v celém automatu a má být na jednom pohledu vidět celé.
 */
export function mayHint(state: GuideState): boolean {
  if (state.phase === "arriving" || state.phase === "reading") return false;
  if (state.hint !== null) return false;
  if (state.hintsShown >= MAX_HINTS) return false;
  if (state.now < ARRIVAL_MS) return false;

  // Klid mezi nápovědami. Nula znamená, že ještě žádná nebyla.
  if (state.lastHintAt > 0 && state.now - state.lastHintAt < COOLDOWN_MS) {
    return false;
  }

  return true;
}

/**
 * Je důvod napovědět? Vrací, proč — nebo nic.
 *
 * Ticho se počítá jen tehdy, když mu předcházela aktivita. Jinak by
 * se napovídalo každému, kdo si odskočil pro kafe.
 */
export function reasonToHint(state: GuideState): Reason | null {
  if (!mayHint(state)) return null;

  if (state.hovers >= HOVER_THRESHOLD) return "hover";

  const quiet = state.now - state.lastActivity;
  if (state.lastActivity > 0 && quiet >= SILENCE_MS) return "silence";

  return null;
}

export function reduce(state: GuideState, event: GuideEvent): GuideState {
  const now = Math.max(state.now, event.at);
  const next: GuideState = { ...state, now };

  // Nápověda zhasne sama, ať se děje cokoliv. Kontroluje se na každé
  // události, takže k tomu není potřeba vlastní časovač.
  if (next.hint && now - next.hint.shownAt >= HINT_MS) {
    next.hint = null;
    next.lastHintAt = now;
  }

  switch (event.type) {
    case "tick":
      break;

    case "move":
      next.lastActivity = now;
      if (next.phase === "arriving" && now >= ARRIVAL_MS) {
        next.phase = "browsing";
      }
      break;

    case "hover":
      next.lastActivity = now;
      next.hovers = next.hovers + 1;
      if (next.phase === "arriving" && now >= ARRIVAL_MS) {
        next.phase = "browsing";
      }
      if (next.phase === "browsing" && next.hovers >= HOVER_THRESHOLD) {
        next.phase = "searching";
      }
      break;

    case "click":
      /*
       * Klepnutí ruší váhání: člověk se rozhodl. Počítadlo přejezdů
       * se nuluje, jinak by se sčítaly napříč celou návštěvou a po
       * chvíli by se napovídalo i tomu, kdo se rozhoduje svižně.
       */
      next.lastActivity = now;
      next.hovers = 0;
      if (next.phase === "searching") next.phase = "browsing";
      break;

    case "engage":
      next.lastActivity = now;
      next.hovers = 0;
      next.phase = "reading";
      // Co je vidět, zhasne: do čtení se nemluví.
      if (next.hint) {
        next.hint = null;
        next.lastHintAt = now;
      }
      break;

    case "scrollEnd":
      next.lastActivity = now;
      if (next.phase === "arriving" && now >= ARRIVAL_MS) {
        next.phase = "browsing";
      }
      /*
       * Doroloval na konec a nic neotevřel. Je to nejsilnější signál,
       * který máme: dočetl, co tam bylo, a pořád neví kam dál.
       */
      if (next.phase === "browsing") next.phase = "searching";
      break;

    case "hidden":
      /*
       * Odešel na jinou kartu. Čas se dál nepočítá — bez toho by se
       * po návratu spustila nápověda z „ticha", které bylo jen tím,
       * že se nedíval.
       */
      next.lastActivity = now;
      break;

    case "visible":
      // Návrat je aktivita, jinak by ticho nabíhalo od staré hodnoty.
      next.lastActivity = now;
      break;
  }

  if (next.phase === "arriving" && now >= ARRIVAL_MS) {
    next.phase = "browsing";
  }

  return next;
}

/** Zapíše do stavu, že se ukázala nápověda. */
export function showHint(
  state: GuideState,
  target: Target,
  reason: Reason,
): GuideState {
  return {
    ...state,
    hint: { target, reason, shownAt: state.now },
    hintsShown: state.hintsShown + 1,
    hovers: 0,
  };
}

/** Zhasne nápovědu dřív, než vyprší — třeba když na cíl někdo klepne. */
export function dismissHint(state: GuideState): GuideState {
  if (!state.hint) return state;
  return { ...state, hint: null, lastHintAt: state.now };
}
