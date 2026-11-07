import zlib from "node:zlib";
import { describe, expect, it } from "vitest";
import { renderPlanPdf, type RenderStrings } from "./render";
import type { StoredPlan } from "./plan";

/**
 * Sazba PDF.
 *
 * Hlavní věc, kterou tohle hlídá, je čeština. Zabudovaná písma v PDF
 * diakritiku neumí a z „Příprava" by byla „Pprava" — jenže soubor by
 * vznikl, nic by nespadlo a poznalo by se to až u zákazníka, který za
 * něj zaplatil. Proto se v hotovém souboru kontroluje, že je písmo
 * vložené a že se text dá přečíst zpátky.
 */

const STRINGS: RenderStrings = {
  subtitle: "Plán na 2 týdny · almost-there.eu",
  coverEyebrow: "Plán k vytištění",
  coverStart: "Začátek: 9. listopadu 2026",
  coverTarget: "Termín: 22. listopadu 2026",
  coverMade: "Vytvořeno 7. listopadu 2026",
  overviewTitle: "Celý plán na jednom místě",
  behindTitle: "Když to nestíháš",
  behindText:
    "Škrtá se odzadu: nejdřív to, co je navíc, až nakonec to, na čem cíl stojí.",
  closingTitle: "Kdyby se ti to mělo odškrtávat samo",
  closingBody: "Tenhle plán je snímek — platí tak, jak je vytištěný.",
  assumptionsLabel: "Z čeho plán vychází",
  challengeLabel: "Čím to prokážeš",
  weekLabel: (i) => `Týden ${i}`,
  minutes: (v) => `${v} min`,
  dayHeading: (iso) => `pondělí ${iso}`,
  weekRange: (a, b) => `${a} – ${b}`,
  page: (c, t) => `${c} / ${t}`,
};

const PLAN: StoredPlan = {
  restatement: "Zvládneš příčestí trpné, řeřichu i ďáblovu nohu.",
  assumptions: ["Šest hodin týdně", "Začínáš od nuly"],
  finalChallenge: "Napíšeš celý test nanečisto a opravíš si ho sám.",
  feasibility: "realistic",
  feasibilityNote: "Termín vychází, když se udrží tempo.",
  weeks: [
    {
      index: 1,
      title: "Rozbor větných členů",
      milestone: "Poznáš přívlastek těsný i volný bez váhání.",
      startDate: "2026-11-09",
      endDate: "2026-11-15",
      days: [
        {
          date: "2026-11-09",
          summary: "Začínáme zlehka.",
          tasks: [
            { title: "Přečíst kapitolu o příčestí trpném", estimatedMinutes: 25 },
            { title: "Zopakovat ěščřžýáíéúůťďň", estimatedMinutes: 15 },
          ],
        },
      ],
    },
    {
      index: 2,
      title: "Souvětí",
      milestone: "Rozlišíš souřadné a podřadné.",
      startDate: "2026-11-16",
      endDate: "2026-11-22",
      days: [
        {
          date: "2026-11-16",
          summary: "Těžší část.",
          tasks: [{ title: "Deset souvětí k rozboru", estimatedMinutes: 40 }],
        },
      ],
    },
  ],
};

describe("renderPlanPdf", () => {
  it("vysází soubor, který je opravdu PDF", async () => {
    const pdf = await renderPlanPdf({
      title: "Příprava na maturitu z češtiny",
      plan: PLAN,
      strings: STRINGS,
    });

    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(2000);
  });

  /*
   * Bez vloženého písma by se diakritika nevykreslila a bez mapy znaků
   * by text v souboru nešlo vyhledat ani zkopírovat. Obojí je známka
   * toho, že se použilo naše písmo, ne zabudované.
   */
  it("vkládá vlastní písmo i mapu znaků", async () => {
    const pdf = await renderPlanPdf({
      title: "Příprava na maturitu",
      plan: PLAN,
      strings: STRINGS,
    });
    const raw = pdf.toString("latin1");

    expect(raw).toContain("/FontFile2");
    expect(raw).toContain("/ToUnicode");
  });

  /*
   * Mapa znaků v PDF udává, kterému znaku odpovídá který glyf, zapsané
   * šestnáctkově. Když se v ní najdou kódy českých písmen, znamená to,
   * že se opravdu vysázela — ne že se tiše zahodila.
   *
   * Obsah PDF je komprimovaný, takže se v syrových bajtech hledat nedá.
   * Proudy se musí nejdřív rozbalit; první verze tohohle testu na to
   * naletěla a tvrdila, že diakritika chybí, i když tam byla.
   */
  it("české znaky v souboru skutečně jsou", async () => {
    const pdf = await renderPlanPdf({
      title: "Příprava na maturitu",
      plan: PLAN,
      strings: STRINGS,
    });

    const text = inflateStreams(pdf);

    for (const [znak, kod] of [
      ["ě", "011b"],
      ["ř", "0159"],
      ["ů", "016f"],
      ["ď", "010f"],
    ] as const) {
      expect(text.toLowerCase(), `chybí ${znak}`).toContain(kod);
    }
  });

  it("delší plán se zalomí na víc stran", async () => {
    const dlouhy: StoredPlan = {
      ...PLAN,
      weeks: Array.from({ length: 12 }, (_, i) => ({
        ...PLAN.weeks[0],
        index: i + 1,
        days: Array.from({ length: 6 }, (_, d) => ({
          date: `2026-11-${String(9 + d).padStart(2, "0")}`,
          summary: "Den plný práce s dlouhým popisem, ať to zabere místo.",
          tasks: Array.from({ length: 4 }, (_, t) => ({
            title: `Úkol číslo ${t + 1} s přiměřeně dlouhým názvem k zaškrtnutí`,
            estimatedMinutes: 30,
          })),
        })),
      })),
    };

    const pdf = await renderPlanPdf({
      title: "Dvanáctitýdenní příprava",
      plan: dlouhy,
      strings: STRINGS,
    });

    // Každá strana je v souboru vlastní objekt typu /Page.
    const stran = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? [])
      .length;
    expect(stran).toBeGreaterThan(3);
  });
});

/**
 * Rozbalí všechny komprimované proudy v PDF a slepí je k sobě.
 *
 * Jen pro testy. PDF ukládá text i mapy znaků zabalené, takže na
 * syrových bajtech se nedá ověřit nic o obsahu.
 */
function inflateStreams(pdf: Buffer): string {
  const parts: string[] = [];
  const marker = Buffer.from("stream");
  const endMarker = Buffer.from("endstream");

  let from = 0;
  for (;;) {
    const start = pdf.indexOf(marker, from);
    if (start === -1) break;

    const end = pdf.indexOf(endMarker, start);
    if (end === -1) break;

    // Za slovem „stream" následuje konec řádku, který do dat nepatří.
    let begin = start + marker.length;
    while (pdf[begin] === 0x0d || pdf[begin] === 0x0a) begin++;

    try {
      parts.push(zlib.inflateSync(pdf.subarray(begin, end)).toString("latin1"));
    } catch {
      // Nezabalený nebo jinak zabalený proud. Nevadí, bereme, co jde.
    }

    from = end + endMarker.length;
  }

  return parts.join("\n");
}
