import type { PdfPlanTemplate } from "./index";

/**
 * Velké zařizování. Jediná skupina, která se plánuje po týdnech,
 * ne po dnech — a je to na ní to podstatné.
 */
export const life: PdfPlanTemplate[] = [
  {
    id: "svatba",
    area: "life",
    granularity: "weekly",
    suggestedWeeks: 52,
    guidance: `The goal is a wedding on a fixed date. This is organising, not practising: the plan is a list of things to arrange each week, never a timetable of what to do on which day.

What decides the order is lead time, not importance:
1. The venue and the date come first, because everything else depends on them and the good dates go a year ahead. Nothing else can be booked until these are signed.
2. Then whatever has the longest waiting time: the dress and suit (alterations take eight to twelve weeks and nobody believes this until it is too late), the photographer and the band (booked a year ahead for summer Saturdays), the rings if they are made to order.
3. The things that depend on numbers — catering, seating, the cake — come after the invitations are back, not before. Planning them earlier means doing them twice.
4. Invitations go out three months ahead, replies are chased four weeks before, and the chasing is its own task. People do not reply.
5. The last month is the one everyone underestimates: final numbers to the caterer, the seating plan, the timings for everyone involved, and a written schedule for the day itself.

The mistake that sinks people: leaving the paperwork to the end. Registry office requirements, documents and deadlines differ by country and take weeks; this belongs in the first third of the plan.

How to measure progress: something is done when it is confirmed in writing and the deposit is paid. "We agreed it on the phone" is not done, and the task should say so.

Do not include: anything on how the couple should feel, what the wedding should mean, or advice about the relationship. Only things that can be arranged and ticked off.

Leave the last two weeks deliberately light. Everything that can be finished earlier must be, because the fortnight before a wedding fills itself.

Estimates in minutes are for the couple's own effort. For anything that is mostly phoning and waiting on someone else, use 0 — an invented number is worse than none.`,
    text: {
      cs: {
        title: "Svatba za rok",
        pitch:
          "Co zařídit který týden, od rezervace místa po rozpis svatebního dne. Bez rozpisu po dnech — ten by u zařizování stejně nikdo nedodržel.",
        forWhom:
          "Pro toho, kdo má datum a hrůzu, že se na něco zapomene.",
        outline: [
          "Nejdřív místo a termín. Všechno ostatní na nich visí a dobré termíny jsou rok dopředu pryč",
          "Pak věci s nejdelší čekací dobou: šaty a oblek, fotograf, kapela, prsteny na zakázku",
          "Papírování patří do první třetiny, ne na konec — úřady mají lhůty a ty se nedají uspíšit",
          "Počty až po návratu odpovědí. Urgování pozvánek je samostatný úkol, protože lidé neodpovídají",
          "Poslední měsíc se podceňuje nejvíc: konečné počty, zasedací pořádek a časový rozpis pro všechny",
        ],
        whenBehind:
          "Škrtá se výzdoba, podrobnosti a všechno, co se dá dokoupit týden předem. Nikdy se neodkládá papírování a nic, kde čeká někdo jiný — tam zpoždění není vaše a nedá se dohnat. Když se nestíhá, volá se dodavatelům dřív, ne později: termín, na který se čeká, se zkrátit nedá, ale ten, kdo ví včas, většinou něco vymyslí.",
        goal: "Uspořádat svatbu ",
      },
      en: {
        title: "A wedding in a year",
        pitch:
          "What to arrange each week, from booking the venue to the schedule for the day itself. No day-by-day timetable — nobody keeps one of those for organising anyway.",
        forWhom: "For anyone with a date and a fear of forgetting something.",
        outline: [
          "The venue and the date first. Everything else hangs on them and the good dates go a year ahead",
          "Then whatever has the longest waiting time: dress and suit, photographer, band, made-to-order rings",
          "Paperwork belongs in the first third, not at the end — offices have deadlines and they do not move",
          "Numbers only once the replies are in. Chasing invitations is its own task, because people do not reply",
          "The last month is the one everyone underestimates: final numbers, the seating plan and timings for everyone involved",
        ],
        whenBehind:
          "Decorations go first, then details, then anything that can be bought a week before. Never postpone the paperwork or anything where someone else is the one working — that delay is not yours and cannot be made up. When you are behind, call suppliers earlier rather than later: a lead time cannot be shortened, but someone who knows in time usually finds a way.",
        goal: "Organise our wedding on ",
      },
      de: {
        title: "Hochzeit in einem Jahr",
        pitch:
          "Was in welcher Woche zu erledigen ist, von der Location bis zum Ablaufplan des Tages. Kein Tagesplan — den hält beim Organisieren ohnehin niemand ein.",
        forWhom:
          "Für alle mit einem Datum und der Angst, etwas zu vergessen.",
        outline: [
          "Zuerst Location und Termin. Alles andere hängt daran, und gute Termine sind ein Jahr im Voraus weg",
          "Dann alles mit langer Wartezeit: Kleid und Anzug, Fotograf, Band, Ringe nach Maß",
          "Der Papierkram gehört ins erste Drittel, nicht ans Ende — Ämter haben Fristen, die sich nicht verkürzen lassen",
          "Zahlen erst, wenn die Zusagen da sind. Das Nachfassen der Einladungen ist eine eigene Aufgabe, denn die Leute antworten nicht",
          "Der letzte Monat wird am meisten unterschätzt: endgültige Zahlen, Sitzordnung und Zeitplan für alle Beteiligten",
        ],
        whenBehind:
          "Zuerst fällt die Deko weg, dann Details, dann alles, was man eine Woche vorher kaufen kann. Nie verschoben werden der Papierkram und alles, wo jemand anderes arbeitet — diese Verzögerung ist nicht deine und lässt sich nicht aufholen. Wenn es eng wird, ruf Dienstleister früher an statt später: eine Lieferzeit lässt sich nicht verkürzen, aber wer rechtzeitig Bescheid weiß, findet meist einen Weg.",
        goal: "Unsere Hochzeit organisieren am ",
      },
    },
  },
];
