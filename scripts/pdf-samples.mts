import { mkdirSync, writeFileSync } from "node:fs";
import { renderPlanPdf, type RenderStrings } from "../src/lib/pdf-plans/render";
import type { StoredPlan } from "../src/lib/pdf-plans/plan";
import { locales, type Locale } from "../src/i18n/routing";

/**
 * Ukázkové PDF pro stránku s nabídkou.
 *
 * Platí se předem, takže kromě osnovy šablony je tohle jediné, co
 * člověk před nákupem uvidí. Musí to tedy být opravdový výstup téhož
 * sázecího kódu, ne obrázek nebo napodobenina v HTML — jinak by se
 * dřív nebo později rozešlo, co slibujeme, s tím, co přijde.
 *
 * Generuje se ručně příkazem `npm run pdf-samples`, ne při každém
 * sestavení: obsah se mění jednou za čas a výsledek se commituje.
 * Když se změní sazba nebo tyhle texty, spusť to znovu.
 *
 * Obsah je smyšlený, ale vypadá jako skutečný plán — dva týdny
 * z dvanáctitýdenní přípravy. Dva stačí: ukazuje se podoba, ne celý
 * dokument, a celý by navíc prozradil, za co se platí.
 */

type Sample = {
  title: string;
  plan: StoredPlan;
  strings: RenderStrings;
};

const SAMPLES: Record<Locale, Sample> = {
  cs: {
    title: "Příprava na maturitu z matematiky",
    plan: {
      restatement:
        "Za dvanáct týdnů zvládneš maturitu z matematiky: projdeš okruhy, doženeš mezery a odejdeš od čtyř celých testů nanečisto.",
      assumptions: [
        "Šest hodin týdně, většinou po škole",
        "Funkce a rovnice umíš, stereometrie je slabé místo",
        "Jeden den v týdnu je volno",
      ],
      finalChallenge:
        "Napíšeš celý maturitní test nanečisto, v čase, bez pomoci a bez tahání — a sám si ho opravíš.",
      feasibility: "realistic",
      feasibilityNote: "Při šesti hodinách týdně to vychází, když se udrží tempo.",
      granularity: "daily",
      periods: [
        {
          index: 1,
          title: "Zjistit, co vlastně chybí",
          milestone:
            "Máš rozdělené všechny okruhy na tři hromádky: umím vysvětlit, poznám, nikdy jsem neviděl.",
          startDate: "2027-01-11",
          endDate: "2027-01-17",
          slots: [
            {
              startDate: "2027-01-11",
              endDate: "2027-01-11",
              summary: "Dneska se neučí, dneska se třídí.",
              tasks: [
                { title: "Vytisknout si oficiální seznam maturitních okruhů", estimatedMinutes: 10 },
                { title: "Projít prvních deset okruhů a u každého napsat, jestli ho umíš vysvětlit nahlas", estimatedMinutes: 45 },
              ],
            },
            {
              startDate: "2027-01-12",
              endDate: "2027-01-12",
              summary: "Druhá polovina seznamu.",
              tasks: [
                { title: "Dotřídit zbylé okruhy stejným způsobem", estimatedMinutes: 45 },
                { title: "Seřadit hromádku „nikdy jsem neviděl“ podle toho, kolik bodů za to u zkoušky je", estimatedMinutes: 20 },
              ],
            },
            {
              startDate: "2027-01-14",
              endDate: "2027-01-14",
              summary: "První mezera, ta nejtěžší.",
              tasks: [
                { title: "Stereometrie: objem a povrch rotačních těles, přečíst a shrnout vlastními slovy", estimatedMinutes: 50 },
                { title: "Pět úloh na objem, bez kalkulačky", estimatedMinutes: 40 },
              ],
            },
          ],
        },
        {
          index: 2,
          title: "Nejtěžší mezery, dokud je čas",
          milestone:
            "Stereometrii umíš vysvětlit nahlas a spočítáš běžnou úlohu bez nahlížení do vzorců.",
          startDate: "2027-01-18",
          endDate: "2027-01-24",
          slots: [
            {
              startDate: "2027-01-18",
              endDate: "2027-01-18",
              summary: "Kuželosečky od začátku.",
              tasks: [
                { title: "Kružnice a elipsa: odvodit rovnice, ne se je učit nazpaměť", estimatedMinutes: 50 },
                { title: "Osm úloh z loňských zadání", estimatedMinutes: 45 },
              ],
            },
            {
              startDate: "2027-01-20",
              endDate: "2027-01-20",
              summary: "Kontrola, že to drží.",
              tasks: [
                { title: "Vysvětlit stereometrii nahlas, jako bys ji někomu učil — bez poznámek", estimatedMinutes: 20 },
                { title: "Co nešlo vysvětlit, dohledat a zkusit znovu", estimatedMinutes: 40 },
              ],
            },
          ],
        },
      ],
    },
    strings: strings("cs", "Ukázka · plán na 12 týdnů · almost-there.eu", {
      assumptions: "Z čeho plán vychází",
      challenge: "Čím to prokážeš",
      week: "Týden",
      min: "min",
      eyebrow: "Ukázka plánu k vytištění",
      start: "Začátek: 11. ledna 2027",
      target: "Termín: 2. dubna 2027",
      made: "Vytvořeno 7. listopadu 2026",
      overview: "Celý plán na jednom místě",
      behindTitle: "Když to nestíháš",
      behindText:
        "Škrtají se okruhy s nejmenší vahou u zkoušky. Celé testy nanečisto zůstávají vždycky — přijít ke zkoušce se čtyřmi hotovými testy je lepší než každý okruh znát z poloviny.",
      closingTitle: "Kdyby se ti to mělo odškrtávat samo",
      closingBody:
        "Tenhle plán je snímek — platí tak, jak je vytištěný. V aplikaci na almost-there.eu máš totéž živé: odškrtáváš v telefonu, vidíš, jak ti to jde, a když se cesta rozejde se skutečností, zbytek se přepočítá podle tvého skutečného tempa.",
    }),
  },

  en: {
    title: "Preparing for my maths final",
    plan: {
      restatement:
        "In twelve weeks you will be ready for your maths final: every topic sorted, the gaps closed, and four full past papers behind you.",
      assumptions: [
        "Six hours a week, mostly after school",
        "Functions and equations are fine, solid geometry is the weak spot",
        "One day a week is off",
      ],
      finalChallenge:
        "You sit a whole past paper, timed, unaided and without looking anything up — and mark it yourself.",
      feasibility: "realistic",
      feasibilityNote: "Six hours a week works, as long as the pace holds.",
      granularity: "daily",
      periods: [
        {
          index: 1,
          title: "Find out what is actually missing",
          milestone:
            "Every topic is in one of three piles: can explain it, recognise it, never seen it.",
          startDate: "2027-01-11",
          endDate: "2027-01-17",
          slots: [
            {
              startDate: "2027-01-11",
              endDate: "2027-01-11",
              summary: "No studying today. Sorting.",
              tasks: [
                { title: "Print the official topic list for your exam", estimatedMinutes: 10 },
                { title: "Go through the first ten topics and note whether you could explain each one out loud", estimatedMinutes: 45 },
              ],
            },
            {
              startDate: "2027-01-12",
              endDate: "2027-01-12",
              summary: "The second half of the list.",
              tasks: [
                { title: "Sort the remaining topics the same way", estimatedMinutes: 45 },
                { title: "Order the “never seen it” pile by how many marks each is worth", estimatedMinutes: 20 },
              ],
            },
            {
              startDate: "2027-01-14",
              endDate: "2027-01-14",
              summary: "The first gap, the hardest one.",
              tasks: [
                { title: "Solid geometry: volume and surface area of solids of revolution, read and summarise in your own words", estimatedMinutes: 50 },
                { title: "Five volume problems, no calculator", estimatedMinutes: 40 },
              ],
            },
          ],
        },
        {
          index: 2,
          title: "The hardest gaps, while there is time",
          milestone:
            "You can explain solid geometry out loud and solve a standard problem without looking up formulas.",
          startDate: "2027-01-18",
          endDate: "2027-01-24",
          slots: [
            {
              startDate: "2027-01-18",
              endDate: "2027-01-18",
              summary: "Conic sections from scratch.",
              tasks: [
                { title: "Circle and ellipse: derive the equations rather than memorising them", estimatedMinutes: 50 },
                { title: "Eight problems from last year's papers", estimatedMinutes: 45 },
              ],
            },
            {
              startDate: "2027-01-20",
              endDate: "2027-01-20",
              summary: "Checking it held.",
              tasks: [
                { title: "Explain solid geometry out loud as if teaching it — no notes", estimatedMinutes: 20 },
                { title: "Whatever you could not explain, look up and try again", estimatedMinutes: 40 },
              ],
            },
          ],
        },
      ],
    },
    strings: strings("en", "Sample · a 12 week plan · almost-there.eu", {
      assumptions: "What the plan assumes",
      challenge: "How you will prove it",
      week: "Week",
      min: "min",
      eyebrow: "A sample plan to print",
      start: "Starts: 11 January 2027",
      target: "Deadline: 2 April 2027",
      made: "Created 7 November 2026",
      overview: "The whole plan in one place",
      behindTitle: "When you fall behind",
      behindText:
        "The topics worth fewest marks get cut. Whole past papers always stay — walking in having done four complete papers beats half-knowing everything.",
      closingTitle: "If you would rather it ticked itself off",
      closingBody:
        "This plan is a snapshot — it holds exactly as printed. The app at almost-there.eu gives you the same thing live: you tick things off on your phone, you see how you are doing, and when the path parts ways with reality the rest is recalculated to the pace you actually keep.",
    }),
  },

  de: {
    title: "Vorbereitung auf die Matheprüfung",
    plan: {
      restatement:
        "In zwölf Wochen bist du bereit: alle Themen sortiert, die Lücken geschlossen und vier ganze Prüfungen zur Übung hinter dir.",
      assumptions: [
        "Sechs Stunden pro Woche, meist nach der Schule",
        "Funktionen und Gleichungen sitzen, Stereometrie ist die Schwachstelle",
        "Ein Tag pro Woche ist frei",
      ],
      finalChallenge:
        "Du schreibst eine ganze alte Prüfung, auf Zeit, ohne Hilfe und ohne Nachschlagen — und korrigierst sie selbst.",
      feasibility: "realistic",
      feasibilityNote: "Sechs Stunden pro Woche reichen, wenn das Tempo hält.",
      granularity: "daily",
      periods: [
        {
          index: 1,
          title: "Herausfinden, was wirklich fehlt",
          milestone:
            "Jedes Thema liegt auf einem von drei Stapeln: kann ich erklären, erkenne ich, nie gesehen.",
          startDate: "2027-01-11",
          endDate: "2027-01-17",
          slots: [
            {
              startDate: "2027-01-11",
              endDate: "2027-01-11",
              summary: "Heute wird nicht gelernt, heute wird sortiert.",
              tasks: [
                { title: "Die offizielle Themenliste für deine Prüfung ausdrucken", estimatedMinutes: 10 },
                { title: "Die ersten zehn Themen durchgehen und notieren, ob du sie laut erklären könntest", estimatedMinutes: 45 },
              ],
            },
            {
              startDate: "2027-01-12",
              endDate: "2027-01-12",
              summary: "Die zweite Hälfte der Liste.",
              tasks: [
                { title: "Die restlichen Themen genauso sortieren", estimatedMinutes: 45 },
                { title: "Den Stapel „nie gesehen“ danach ordnen, wie viele Punkte darauf entfallen", estimatedMinutes: 20 },
              ],
            },
            {
              startDate: "2027-01-14",
              endDate: "2027-01-14",
              summary: "Die erste Lücke, die schwerste.",
              tasks: [
                { title: "Stereometrie: Volumen und Oberfläche von Rotationskörpern lesen und in eigenen Worten zusammenfassen", estimatedMinutes: 50 },
                { title: "Fünf Volumenaufgaben, ohne Taschenrechner", estimatedMinutes: 40 },
              ],
            },
          ],
        },
        {
          index: 2,
          title: "Die schwersten Lücken, solange Zeit ist",
          milestone:
            "Du kannst Stereometrie laut erklären und eine übliche Aufgabe ohne Formelsammlung lösen.",
          startDate: "2027-01-18",
          endDate: "2027-01-24",
          slots: [
            {
              startDate: "2027-01-18",
              endDate: "2027-01-18",
              summary: "Kegelschnitte von vorn.",
              tasks: [
                { title: "Kreis und Ellipse: die Gleichungen herleiten statt auswendig lernen", estimatedMinutes: 50 },
                { title: "Acht Aufgaben aus den Prüfungen des Vorjahres", estimatedMinutes: 45 },
              ],
            },
            {
              startDate: "2027-01-20",
              endDate: "2027-01-20",
              summary: "Prüfen, ob es hält.",
              tasks: [
                { title: "Stereometrie laut erklären, als würdest du sie unterrichten — ohne Notizen", estimatedMinutes: 20 },
                { title: "Was du nicht erklären konntest, nachschlagen und erneut versuchen", estimatedMinutes: 40 },
              ],
            },
          ],
        },
      ],
    },
    strings: strings("de", "Beispiel · Plan für 12 Wochen · almost-there.eu", {
      assumptions: "Wovon der Plan ausgeht",
      challenge: "Woran du es misst",
      week: "Woche",
      min: "Min.",
      eyebrow: "Beispielplan zum Ausdrucken",
      start: "Beginn: 11. Januar 2027",
      target: "Termin: 2. April 2027",
      made: "Erstellt am 7. November 2026",
      overview: "Der ganze Plan an einer Stelle",
      behindTitle: "Wenn du hinterherhinkst",
      behindText:
        "Die Themen mit dem geringsten Gewicht fallen weg. Ganze Prüfungen zur Übung bleiben immer — mit vier fertigen Prüfungen anzutreten ist besser, als alles halb zu können.",
      closingTitle: "Falls es sich von selbst abhaken soll",
      closingBody:
        "Dieser Plan ist eine Momentaufnahme — er gilt genau so, wie er gedruckt ist. In der App auf almost-there.eu hast du dasselbe lebendig: Du hakst am Handy ab, siehst, wie es läuft, und wenn der Weg von der Wirklichkeit abweicht, wird der Rest an dein tatsächliches Tempo angepasst.",
    }),
  },
};

function strings(
  locale: Locale,
  subtitle: string,
  labels: {
    assumptions: string;
    challenge: string;
    week: string;
    min: string;
    eyebrow: string;
    start: string;
    target: string;
    made: string;
    overview: string;
    behindTitle: string;
    behindText: string;
    closingTitle: string;
    closingBody: string;
  },
): RenderStrings {
  const dayFormat = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "numeric",
  });
  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
  });
  const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

  return {
    subtitle,
    coverEyebrow: labels.eyebrow,
    coverStart: labels.start,
    coverTarget: labels.target,
    coverMade: labels.made,
    overviewTitle: labels.overview,
    behindTitle: labels.behindTitle,
    behindText: labels.behindText,
    closingTitle: labels.closingTitle,
    closingBody: labels.closingBody,
    assumptionsLabel: labels.assumptions,
    challengeLabel: labels.challenge,
    periodLabel: (index) => `${labels.week} ${index}`,
    minutes: (value) => `${value} ${labels.min}`,
    slotHeading: (iso) => dayFormat.format(at(iso)),
    periodRange: (a, b) => `${dateFormat.format(at(a))} – ${dateFormat.format(at(b))}`,
    page: (current, total) => `${current} / ${total}`,
  };
}

mkdirSync("public/samples", { recursive: true });

for (const locale of locales) {
  const sample = SAMPLES[locale];
  const pdf = await renderPlanPdf({
    title: sample.title,
    plan: sample.plan,
    strings: sample.strings,
  });

  const file = `public/samples/plan-${locale}.pdf`;
  writeFileSync(file, pdf);
  console.log(`${file} — ${(pdf.length / 1024).toFixed(0)} kB`);
}

console.log("ukázky hotové");
