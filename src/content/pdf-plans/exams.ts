import type { PdfPlanTemplate } from "./index";

/**
 * Zkoušky. V češtině je to nejvyhledávanější skupina a zároveň ta,
 * kde se nejhůř hledá něco jiného než obecné „učte se průběžně".
 */
export const exams: PdfPlanTemplate[] = [
  {
    id: "zkouskove",
    area: "exams",
    granularity: "daily",
    suggestedWeeks: 6,
    guidance: `The goal is a university exam period: several exams with fixed, known dates, taken over a few weeks. This is not one exam — it is a queue of them, and that changes everything.

What makes it different from a single exam:
1. The order is given by the dates, not by difficulty or by what the person feels like. The first task of the plan is to list every exam with its date, its weight (credits) and how many attempts are left, and to sort by date. Everything after that follows from the list.
2. Work on an exam starts late and ends on its date. Studying for an exam three weeks out while the nearest one is in four days is the most common way people fail the nearest one.
3. The days right after an exam belong to the next one, not to rest. Say that explicitly, because the temptation after an exam is to take two days off and those two days are usually the ones that were missing.
4. Subjects with only one attempt left come before everything else of the same date. Failing those costs a year, not a resit.

The mistake that sinks people: spreading effort evenly across all subjects. The exam that is closest and the exam that can still be failed outright are not equal to the rest.

**A rescue mode belongs in the plan, as its own named part.** When someone falls behind — and in an exam period most people do — the plan must say what to drop. The rule: drop breadth in the subjects that are already passed-level, keep the subjects with one attempt left, and never drop sleep the night before an exam. Someone who studies all night before an exam writes it worse than someone who did two thirds and slept.

How to measure progress: being able to answer the exam questions out loud without notes, not having read through the material.

Do not include: making new notes from scratch, or any subject that is not on the list. The plan covers the exam period, nothing else.

Respect the stated hours per week; in an exam period people usually have whole days, so the days can be long — but never all seven, because the period lasts weeks and nobody holds that.`,
    text: {
      cs: {
        title: "Plán na zkouškové",
        pitch:
          "Několik zkoušek s pevnými termíny za pár týdnů. Plán řeší pořadí a to, co obětovat, když začne hořet.",
        forWhom:
          "Pro vysokoškoláka, který má v kalendáři pět termínů a neví, čím začít.",
        outline: [
          "První úkol je sepsat všechny zkoušky s termínem, kredity a počtem zbývajících pokusů — teprve z toho seznamu plán vychází",
          "Pořadí určují data, ne obtížnost. Učit se na zkoušku za tři týdny, když je nejbližší za čtyři dny, je nejčastější způsob, jak tu nejbližší položit",
          "Dny hned po zkoušce patří té další, ne odpočinku. Zní to tvrdě, ale právě ty dva dny volna většinou chybí",
          "Předměty, kde zbývá poslední pokus, jdou před vším ostatním ze stejného data",
          "Záchranný režim jako vlastní část plánu: co škrtnout, až začne hořet",
        ],
        whenBehind:
          "Škrtá se šířka u předmětů, které už jsou na projití, a drží se ty s posledním pokusem. Nikdy se neškrtá spánek před zkouškou — kdo se učí celou noc, napíše ji hůř než ten, kdo uměl dvě třetiny a vyspal se. A radši jeden předmět pořádně než tři napůl: z napůl naučených tří projdou obvykle nula.",
        goal: "Zvládnout zkouškové ",
      },
      en: {
        title: "A plan for exam period",
        pitch:
          "Several exams with fixed dates over a few weeks. The plan handles the order and what to sacrifice when it starts burning.",
        forWhom:
          "For a university student with five dates in the calendar and no idea where to start.",
        outline: [
          "The first task is listing every exam with its date, credits and attempts left — the plan is built from that list",
          "The dates decide the order, not the difficulty. Studying for an exam three weeks out while the nearest is in four days is the usual way to fail the nearest one",
          "The days right after an exam belong to the next one, not to rest. It sounds harsh, but those two days off are usually the ones that were missing",
          "Subjects with one attempt left come before everything else on the same date",
          "A rescue mode as its own part of the plan: what to drop when it starts burning",
        ],
        whenBehind:
          "Drop breadth in the subjects already at passing level and keep the ones with a single attempt left. Never drop sleep the night before an exam — someone who studies all night writes it worse than someone who knew two thirds and slept. And one subject properly beats three half-done: of three half-learned subjects, usually none pass.",
        goal: "Get through my exam period ",
      },
      de: {
        title: "Plan für die Prüfungsphase",
        pitch:
          "Mehrere Prüfungen mit festen Terminen in wenigen Wochen. Der Plan regelt die Reihenfolge und das, was geopfert wird, wenn es brennt.",
        forWhom:
          "Für Studierende mit fünf Terminen im Kalender und keiner Ahnung, womit anfangen.",
        outline: [
          "Die erste Aufgabe ist, alle Prüfungen mit Termin, Credits und verbleibenden Versuchen aufzuschreiben — darauf baut der ganze Plan",
          "Die Termine bestimmen die Reihenfolge, nicht die Schwierigkeit. Für eine Prüfung in drei Wochen zu lernen, während die nächste in vier Tagen ist, ist der übliche Weg, die nächste zu verhauen",
          "Die Tage direkt nach einer Prüfung gehören der nächsten, nicht der Erholung. Das klingt hart, aber genau diese zwei freien Tage fehlen am Ende",
          "Fächer mit dem letzten Versuch kommen vor allem anderen desselben Termins",
          "Ein Rettungsmodus als eigener Teil des Plans: was wegfällt, wenn es brennt",
        ],
        whenBehind:
          "Streiche die Breite bei Fächern, die schon auf Bestehen stehen, und halte die mit dem letzten Versuch. Nie gestrichen wird der Schlaf vor einer Prüfung — wer die ganze Nacht lernt, schreibt schlechter als jemand, der zwei Drittel konnte und geschlafen hat. Und ein Fach richtig schlägt drei halb: von drei halb gelernten besteht meist keines.",
        goal: "Die Prüfungsphase schaffen ",
      },
    },
  },
  {
    id: "maturita",
    area: "exams",
    granularity: "daily",
    suggestedWeeks: 12,
    guidance: `The goal is a final secondary-school exam — in the Czech system the maturita, elsewhere A-levels, Abitur or their equivalent. Do not assume a country: the person's own goal text names the subject and the system, and the plan must follow that rather than any one country's format. The date is fixed and cannot move, so the plan works backwards from it.

Order that cannot be reversed:
1. First, find out what is actually missing. The first week is diagnosis, not studying: go through the official topic list for their exam and mark each topic as "can explain it to someone", "recognise it", or "never seen it". Everything after this depends on that list.
2. Then the gaps, hardest first, while there is still time to fail at them.
3. Only then whole past papers under exam conditions.
4. The last two weeks are revision and spaced repetition of what was already learned. No new topics — anything started this late will not hold.

The mistake that sinks people: studying the topics they already like, because it feels productive. The plan must name specific weak topics and schedule them, not say "study maths".

How to measure progress: a topic counts as done when the person can explain it out loud, without notes, in a few sentences. Not when they have read it. Put that test in the task wording.

Do not include: making pretty notes, colour-coding, rewriting textbooks. It eats the time and teaches nothing.

What to cut when behind: drop the topics with the lowest weight in the exam and keep whole past papers. Walking in having done four complete papers beats half-knowing everything.

Daily tasks must be small enough to finish on a school night — the person has lessons during the day. Respect the stated hours per week and spread them so that at least one day a week is free.`,
    text: {
      cs: {
        title: "Příprava na maturitu",
        pitch:
          "Rozpis až na jednotlivé dny, který počítá s tím, že chodíš do školy a nemáš celý den.",
        forWhom:
          "Pro toho, kdo ví, že se má učit, ale neví, čím začít a kolik toho stihne.",
        outline: [
          "První týden se neučíš — procházíš okruhy a značíš, co umíš vysvětlit, co poznáš a co jsi nikdy neviděl",
          "Pak slabá místa, od nejtěžšího, dokud je čas na ně narazit",
          "Celé zkouškové testy nanečisto, za stejných podmínek jako doopravdy",
          "Poslední dva týdny jen opakování. Nic nového, to by se neudrželo",
        ],
        whenBehind:
          "Škrtají se okruhy s nejmenší vahou u zkoušky. Celé testy nanečisto zůstávají vždycky — přijít ke zkoušce se čtyřmi hotovými testy je lepší než každý okruh znát z poloviny.",
        goal: "Připravit se na maturitu z ",
      },
      en: {
        title: "Preparing for final exams",
        pitch:
          "A day-by-day plan that assumes you are at school all day and do not have endless time.",
        forWhom:
          "For anyone who knows they should study but not where to start or how much will fit.",
        outline: [
          "The first week is not studying — you go through the syllabus and mark what you can explain, what you recognise, and what you have never seen",
          "Then the gaps, hardest first, while there is still time to fail at them",
          "Whole past papers under real exam conditions",
          "The last two weeks are revision only. Nothing new; it would not hold",
        ],
        whenBehind:
          "The topics worth fewest marks get cut. Whole past papers always stay — walking in having done four complete papers beats half-knowing everything.",
        goal: "Prepare for my final exam in ",
      },
      de: {
        title: "Vorbereitung auf die Abschlussprüfung",
        pitch:
          "Ein Plan bis auf den einzelnen Tag, der damit rechnet, dass du tagsüber in der Schule bist.",
        forWhom:
          "Für alle, die wissen, dass sie lernen sollten, aber nicht womit anfangen.",
        outline: [
          "In der ersten Woche lernst du nicht — du gehst die Themen durch und markierst, was du erklären kannst, was du wiedererkennst und was du nie gesehen hast",
          "Dann die Lücken, die schwerste zuerst, solange noch Zeit bleibt, daran zu scheitern",
          "Ganze alte Prüfungen unter echten Bedingungen",
          "Die letzten zwei Wochen nur Wiederholung. Nichts Neues, das würde nicht halten",
        ],
        whenBehind:
          "Die Themen mit dem geringsten Gewicht fallen weg. Ganze Prüfungen zur Übung bleiben immer — mit vier fertigen Prüfungen anzutreten ist besser, als alles halb zu können.",
        goal: "Mich auf die Abschlussprüfung vorbereiten in ",
      },
    },
  },
  {
    id: "prijimacky",
    area: "exams",
    granularity: "daily",
    suggestedWeeks: 10,
    guidance: `The goal is an entrance exam to a selective school or university — in the Czech system přijímačky, elsewhere an admissions test. Do not assume a country; the person's goal text names the school. Unlike school-leaving exams, the content is narrow and known in advance, and the scoring is competitive: it is not about passing, it is about scoring higher than other candidates.

That changes the plan:
1. Week one: take one full past paper cold, before any studying, and score it honestly. Without that number there is nothing to improve against and no way to tell whether the plan is working.
2. Then drill the question types that lost the most points, not the topics that feel weakest. These differ more often than people expect.
3. Speed is a separate skill from knowledge. From the halfway point every practice paper is timed, because most points are lost to running out of time, not to not knowing.
4. The last two weeks: one full timed paper every few days, and going through the mistakes. Going through the mistakes takes longer than the paper itself — say so in the task.

The mistake that sinks people: doing practice papers and only counting the score, without going through what went wrong. A paper not reviewed teaches nothing.

How to measure progress: points on a timed past paper, written down every time, so the line is visible.

Do not include: new textbooks, new sources, anything that is not a past paper or a drill of a known question type.

What to cut when behind: drop the rarest question types and keep the timed papers.

Respect the stated hours per week; the person is usually also at school.`,
    text: {
      cs: {
        title: "Příprava na přijímačky",
        pitch:
          "Plán postavený na tom, že u přijímaček nejde o to projít, ale mít víc bodů než ostatní.",
        forWhom: "Pro toho, kdo se hlásí na školu, kam se nedostane každý.",
        outline: [
          "Hned první týden jeden celý test nanečisto, bez přípravy, a poctivě spočítat body",
          "Pak se trénují typy úloh, na kterých se ztratilo nejvíc bodů — ne ty, co se zdají nejtěžší",
          "Od poloviny se měří čas. Většina bodů se neztrácí neznalostí, ale tím, že se to nestihne",
          "Na konci test každých pár dní a hlavně rozbor chyb, který trvá dýl než test sám",
        ],
        whenBehind:
          "Škrtají se nejvzácnější typy úloh. Testy na čas a rozbor chyb zůstávají — bez rozboru se z testu nenaučíš nic a právě tam se body získávají.",
        goal: "Dostat se na ",
      },
      en: {
        title: "Preparing for entrance exams",
        pitch:
          "Built on the fact that an entrance exam is not about passing but about scoring higher than the others.",
        forWhom: "For anyone applying somewhere that does not take everyone.",
        outline: [
          "In week one, one full past paper cold, with no preparation, scored honestly",
          "Then drilling the question types that lost the most points — not the ones that feel hardest",
          "From halfway, everything is timed. Most points go to running out of time, not to not knowing",
          "At the end, a paper every few days and, above all, going through the mistakes — which takes longer than the paper",
        ],
        whenBehind:
          "The rarest question types get cut. Timed papers and going through the mistakes stay — a paper you do not review teaches nothing, and that review is where the marks come from.",
        goal: "Get into ",
      },
      de: {
        title: "Vorbereitung auf die Aufnahmeprüfung",
        pitch:
          "Gebaut auf der Tatsache, dass es bei einer Aufnahmeprüfung nicht ums Bestehen geht, sondern um mehr Punkte als die anderen.",
        forWhom: "Für alle, die sich dort bewerben, wo nicht jeder genommen wird.",
        outline: [
          "In der ersten Woche eine ganze alte Prüfung ohne Vorbereitung, ehrlich ausgewertet",
          "Dann die Aufgabentypen üben, die die meisten Punkte gekostet haben — nicht die, die am schwersten wirken",
          "Ab der Hälfte wird die Zeit gemessen. Die meisten Punkte gehen durch Zeitmangel verloren, nicht durch Unwissen",
          "Am Ende alle paar Tage eine Prüfung und vor allem die Fehleranalyse, die länger dauert als die Prüfung selbst",
        ],
        whenBehind:
          "Die seltensten Aufgabentypen fallen weg. Prüfungen auf Zeit und die Fehleranalyse bleiben — eine Prüfung ohne Nachbereitung bringt nichts, und genau dort entstehen die Punkte.",
        goal: "Aufgenommen werden an ",
      },
    },
  },
];
