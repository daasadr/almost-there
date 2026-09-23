import type { Locale } from "@/i18n/routing";

/**
 * Myšlenka na den.
 *
 * Krátký text, který uživatel dostane ráno v oznámení a může si ho nechat
 * přečíst nahlas. Původně to mělo být namluvené audio; od toho se ustoupilo,
 * protože natočit pět minut denně ve třech jazycích se udržet nedá a
 * generované hlasy zněly špatně. Text je rychlejší napsat, jde přeložit,
 * opravit překlep trvá vteřinu — a od strojového předčítání nikdo nečeká
 * herecký výkon, takže nevadí, že zní jako předčítání.
 *
 * ── Jak přidat další ──────────────────────────────────────────────────
 *
 * Přidej položku do `cs`, `en` i `de` — pořadí musí sedět, protože se
 * vybírá podle čísla. Kontrolu drží `assertSameLength` dole: když jeden
 * jazyk zůstane pozadu, projeví se to při sestavení, ne až u uživatele.
 *
 * ── Délka ─────────────────────────────────────────────────────────────
 *
 * 150 až 250 slov. Delší text v telefonu ráno nikdo nedočte a předčítání
 * by trvalo přes tři minuty. Kratší než sto slov zase nestihne nic říct.
 *
 * ── Tón ───────────────────────────────────────────────────────────────
 *
 * Konkrétně a vlídně. Žádné „všechno zvládneš“, žádné vykřičníky, a hlavně
 * ne poučování — člověk to čte v posteli, ne na semináři. Text nemá nic
 * chtít: nemá vybízet k otevření aplikace ani připomínat, co se nestihlo.
 * Když někoho ráno potěší nebo mu něco došlo, splnil svůj účel.
 *
 * ── Pořadí ────────────────────────────────────────────────────────────
 *
 * Nečte se podle kalendáře, ale podle toho, kolikátý den ten člověk
 * aplikaci má. Kdo se přidá v březnu, začíná jedničkou. Texty proto na
 * sebe nesmí navazovat a nesmí odkazovat na roční období ani na svátky.
 */

export type MotivationPiece = {
  /** Nadpis. Krátký — jde i do oznámení na zamčenou obrazovku. */
  title: string;
  /**
   * Tělo textu po odstavcích.
   *
   * První věta prvního odstavce se ukazuje samostatně jako upoutávka
   * v oznámení i na kartičce, takže musí dávat smysl vytržená z textu.
   */
  paragraphs: string[];
};

const cs: MotivationPiece[] = [
  {
    title: "Začátek nikdy nevypadá jako začátek",
    paragraphs: [
      "První den u nového cíle málokdy připomíná to, co si člověk představoval. Většinou je to patnáct minut něčeho nepřehledného a pocit, že se nic nestalo.",
      "To je v pořádku. Začátek nepoznáš podle toho, jak vypadá, ale podle toho, že po něm přijde druhý den. Teprve zpětně to vypadá jako rozhodnutí — ve chvíli, kdy se to děje, je to jen trochu nepohodlné odpoledne.",
      "Dneska nemusíš udělat nic velkého. Stačí to, co je na řadě, i kdyby to bylo směšně málo. Řada je důležitější než velikost jednotlivého kroku.",
    ],
  },
  {
    title: "Plán a skutečnost se nikdy nepotkají přesně",
    paragraphs: [
      "Každý plán je odhad napsaný někým, kdo ještě nevěděl, jak to dopadne. Ten někdo jsi byl ty, před týdnem nebo před rokem, a neměl jsi informace, které máš teď.",
      "Proto se plán a skutečnost rozcházejí — ne proto, že bys selhal, ale proto, že odhad je odhad. Rozdíl mezi nimi není účet k zaplacení. Je to zpráva o tom, co ses mezitím dozvěděl.",
      "Když ti dneska něco nevyjde podle rozvrhu, zkus si místo „nestihl jsem to“ říct „tohle trvá dýl, než jsem čekal“. Je to pravdivější a dá se s tím pracovat.",
    ],
  },
  {
    title: "Odpočinek není to, co zbude",
    paragraphs: [
      "Volný den se snadno odkládá — vypadá jako to nejméně důležité v rozvrhu, takže ustoupí prvnímu, co přijde. Po třech týdnech to člověk pozná ne na náladě, ale na tom, že mu práce trvá dvakrát dýl.",
      "Odpočinek nedohání únavu. Předchází jí. Když si ho naplánuješ až ve chvíli, kdy ho potřebuješ, je pozdě — potřeboval jsi ho před čtrnácti dny.",
      "Jestli máš dneska volno, tak ho měj. Ne napůl, ne s telefonem otevřeným na seznamu úkolů. Je to součást práce, ne pauza v ní.",
    ],
  },
];

const en: MotivationPiece[] = [
  {
    title: "A beginning never looks like one",
    paragraphs: [
      "The first day of a new goal rarely resembles what you pictured. Usually it is fifteen minutes of something messy and a feeling that nothing happened.",
      "That is fine. You do not recognise a beginning by how it looks, but by the fact that a second day follows it. Only in hindsight does it look like a decision — while it is happening, it is just a slightly uncomfortable afternoon.",
      "You do not have to do anything big today. What is next is enough, even if it is comically small. The sequence matters more than the size of any single step.",
    ],
  },
  {
    title: "The plan and the day never meet exactly",
    paragraphs: [
      "Every plan is a guess written by someone who did not yet know how it would go. That someone was you, a week or a year ago, without the information you have now.",
      "So plans and reality drift apart — not because you failed, but because a guess is a guess. The gap between them is not a bill to pay. It is a report on what you have learned since.",
      "When something slips today, try swapping “I did not get it done” for “this takes longer than I thought.” It is truer, and you can actually work with it.",
    ],
  },
  {
    title: "Rest is not what is left over",
    paragraphs: [
      "A day off is easy to postpone — it looks like the least important thing on the schedule, so it yields to the first thing that comes along. After three weeks you notice it, not in your mood, but in work taking twice as long.",
      "Rest does not catch up on tiredness. It prevents it. If you schedule it only once you need it, you are late — you needed it a fortnight ago.",
      "If today is a day off, have it. Not halfway, not with your phone open on the task list. It is part of the work, not a break from it.",
    ],
  },
];

const de: MotivationPiece[] = [
  {
    title: "Ein Anfang sieht nie nach Anfang aus",
    paragraphs: [
      "Der erste Tag eines neuen Ziels ähnelt selten dem, was man sich vorgestellt hat. Meist sind es fünfzehn unübersichtliche Minuten und das Gefühl, dass nichts passiert ist.",
      "Das ist in Ordnung. Einen Anfang erkennt man nicht daran, wie er aussieht, sondern daran, dass ein zweiter Tag folgt. Erst im Rückblick wirkt er wie eine Entscheidung — während er geschieht, ist er nur ein leicht unbequemer Nachmittag.",
      "Du musst heute nichts Großes tun. Was als Nächstes dran ist, genügt, auch wenn es lächerlich wenig ist. Die Reihe zählt mehr als die Größe des einzelnen Schritts.",
    ],
  },
  {
    title: "Plan und Wirklichkeit treffen sich nie genau",
    paragraphs: [
      "Jeder Plan ist eine Schätzung von jemandem, der noch nicht wusste, wie es ausgeht. Dieser Jemand warst du, vor einer Woche oder vor einem Jahr, ohne die Informationen, die du heute hast.",
      "Deshalb gehen Plan und Wirklichkeit auseinander — nicht weil du versagt hättest, sondern weil eine Schätzung eine Schätzung ist. Der Abstand dazwischen ist keine Rechnung. Er ist ein Bericht darüber, was du inzwischen gelernt hast.",
      "Wenn heute etwas nicht aufgeht, tausche „ich habe es nicht geschafft“ gegen „das dauert länger, als ich dachte“. Das ist wahrer, und damit lässt sich arbeiten.",
    ],
  },
  {
    title: "Erholung ist nicht das, was übrig bleibt",
    paragraphs: [
      "Ein freier Tag lässt sich leicht verschieben — er wirkt wie das Unwichtigste im Plan und weicht dem Erstbesten. Nach drei Wochen merkst du es nicht an der Stimmung, sondern daran, dass alles doppelt so lange dauert.",
      "Erholung holt Müdigkeit nicht nach. Sie kommt ihr zuvor. Wer sie erst einplant, wenn er sie braucht, ist zu spät dran — gebraucht hätte er sie vor vierzehn Tagen.",
      "Wenn heute frei ist, dann hab frei. Nicht halb, nicht mit dem Handy auf der Aufgabenliste. Es gehört zur Arbeit, es ist keine Pause davon.",
    ],
  },
];

/**
 * Jazyky musí mít stejný počet textů — vybírá se podle čísla, ne podle
 * obsahu, takže chybějící položka v jednom jazyce by znamenala, že tomu
 * uživateli ten den nepřijde nic. Padne to při sestavení.
 */
function assertSameLength(): void {
  if (cs.length !== en.length || cs.length !== de.length) {
    throw new Error(
      `Myšlenky na den: jazyky mají různý počet textů (cs=${cs.length}, en=${en.length}, de=${de.length}). Doplň chybějící překlad.`,
    );
  }
}

assertSameLength();

export const motivationByLocale: Record<Locale, MotivationPiece[]> = {
  cs,
  en,
  de,
};

/** Kolik textů knihovna má. Všechny jazyky stejně — viz `assertSameLength`. */
export const MOTIVATION_COUNT = cs.length;
