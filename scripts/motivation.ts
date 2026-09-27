import {
  motivationByLocale,
  type MotivationPiece,
} from "../src/content/motivation/index";

/**
 * Přehled knihovny myšlenek na den.
 *
 * Spouští se ručně: `npm run motivation`. Nic nemění, jen kouká.
 *
 * Vzniklo z toho, že některé vady jdou vidět až napříč knihovnou, a to
 * je přesně to, co při psaní jednoho textu nikoho nenapadne zkontrolovat.
 * U prvních osmi textů se ukázalo, že čtyři z nich začínají skoro
 * identicky — „je tu tichá pravda", „je tichý rozdíl", „je jedna tichá
 * dovednost", „existuje tichá síla". Jednotlivě to nevadí; po sobě to
 * čtenář ucítí, i když nepozná proč.
 *
 * Při osmi textech se to dalo najít okem. Při dvou stech se nedá.
 */

const WORDS_PER_MINUTE = 140;

/** Kolik prvních slov rozhoduje, jestli dva začátky znějí stejně. */
const OPENING_WORDS = 4;

/** V kolika textech musí slovo být, aby stálo za pozornost. */
const OVERUSE_SHARE = 0.4;

/**
 * Slova, která se opakovat mají. Bez nich by výpis hlásil „ty", „den"
 * a „čas" — tedy přesně to, o čem ty texty jsou.
 */
const EXPECTED = new Set([
  "tebe", "tobě", "tvůj", "tvoje", "tvého", "tvým", "svůj", "svoje", "svého",
  "sebe", "sobě", "který", "která", "které", "kterou", "kterým", "kdo",
  "když", "protože", "takže", "přitom", "zatímco", "aby", "abys", "jako",
  "něco", "všechno", "celý", "celé", "jeden", "jedna", "jedno", "jenom",
  "dnes", "dnešek", "dneška", "ráno", "den", "dne", "dny", "dnů", "čas",
  "času", "život", "života", "životu", "práce", "práci", "věc", "věci",
  "člověk", "člověka", "lidé", "lidí", "míst", "místo", "chvíli", "prostor",
]);

const pieces = motivationByLocale.cs;

if (pieces.length === 0) {
  console.log("Knihovna je prázdná.");
  process.exit(0);
}

const words = (text: string): string[] => text.split(/\s+/).filter(Boolean);
const body = (piece: MotivationPiece): string =>
  piece.paragraphs.slice(1, -1).join(" ");

/* ── Přehled ──────────────────────────────────────────────────────── */

const rows = pieces.map((piece, i) => {
  const count = words(piece.paragraphs.join(" ")).length;
  return {
    number: i + 1,
    title: piece.title,
    words: count,
    minutes: (count / WORDS_PER_MINUTE).toFixed(1),
    reviewed: piece.reviewed === true,
  };
});

console.log(`\nMyšlenek na den: ${pieces.length}`);
const done = rows.filter((r) => r.reviewed).length;
console.log(
  `Prošlo ruční úpravou: ${done} — čeká ${pieces.length - done}\n`,
);

for (const row of rows) {
  const mark = row.reviewed ? "✓" : " ";
  const number = String(row.number).padStart(3);
  const length = `${String(row.words).padStart(4)} slov · ${row.minutes} min`;
  console.log(`${mark} ${number}. ${row.title.padEnd(38)} ${length}`);
}

/* ── Opakované začátky ────────────────────────────────────────────── */

const openings = new Map();
pieces.forEach((piece, i) => {
  const first = piece.paragraphs[1] ?? "";
  const key = words(first.toLowerCase())
    .slice(0, OPENING_WORDS)
    .join(" ")
    .replace(/[.,:;?!—]/g, "");
  openings.set(key, [...(openings.get(key) ?? []), i + 1]);
});

const sameOpening = [...openings].filter(([, list]) => list.length > 1);
if (sameOpening.length > 0) {
  console.log("\nStejně znějící začátky:");
  for (const [key, list] of sameOpening) {
    console.log(`  „${key}…" — texty ${list.join(", ")}`);
  }
}

/* ── Opakovaná rozloučení ─────────────────────────────────────────── */

const farewells = new Map();
pieces.forEach((piece, i) => {
  const last = (piece.paragraphs.at(-1) ?? "").toLowerCase();
  farewells.set(last, [...(farewells.get(last) ?? []), i + 1]);
});

const sameFarewell = [...farewells].filter(([, list]) => list.length > 1);
if (sameFarewell.length > 0) {
  console.log("\nStejná rozloučení:");
  for (const [text, list] of sameFarewell) {
    console.log(`  „${text}" — texty ${list.join(", ")}`);
  }
}

/* ── Slova napříč knihovnou ───────────────────────────────────────── */

const inTexts = new Map();
pieces.forEach((piece, i) => {
  const seen = new Set(
    words(body(piece).toLowerCase())
      .map((word: string) => word.replace(/[^\p{L}]/gu, ""))
      .filter((word: string) => word.length >= 5 && !EXPECTED.has(word)),
  );
  for (const word of seen) {
    inTexts.set(word, [...(inTexts.get(word) ?? []), i + 1]);
  }
});

const overused = [...inTexts]
  .filter(([, list]) => list.length >= Math.ceil(pieces.length * OVERUSE_SHARE))
  .sort((a, b) => b[1].length - a[1].length);

if (overused.length > 0) {
  console.log(
    `\nSlova ve ${Math.round(OVERUSE_SHARE * 100)} % a více textech ` +
      `(k posouzení, ne k opravě):`,
  );
  for (const [word, list] of overused.slice(0, 12)) {
    console.log(`  ${word.padEnd(18)} ${list.length}× — texty ${list.join(", ")}`);
  }
}

console.log("");
