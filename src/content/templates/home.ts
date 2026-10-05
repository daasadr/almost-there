import type { GoalTemplate } from "./index";

/**
 * Domov.
 *
 * Nejobsáhlejší pokyn z celé knihovny, a je to schválně: „proměna
 * domova" je nejširší zadání, jaké tu je. Bez podrobného vedení by
 * z toho model udělal úklid — a to je jen první ze čtyř věcí, o které
 * tady jde.
 */

export const home: GoalTemplate[] = [
  {
    id: "home-transformation",
    area: "home",
    defaultMonths: 4,
    guidance: `
Turning a home into a place that actually restores the person living in
it. This is much broader than tidying, and the plan must show that from
the first week. Four strands, in this order:

1. CLEARING OUT. Room by room, category by category. This has to come
   first — nothing else can be arranged while there is too much stuff.
   Plan per category rather than per day, and include the practical
   endgame: where things actually go (sell, give, recycle, discard), and
   a deadline for boxes that are "waiting to be decided", because
   otherwise they stay for years.

2. THE PLACES THAT DECIDE HOW THE PERSON FEELS. Do not treat all rooms
   as equal. Prioritise, explicitly, and give each of these a real task:
   - Sleep: is the bed genuinely comfortable, is the room dark enough
     and quiet enough, is the mattress past its life, is there screen
     light or standby light at night.
   - The first ten minutes of the morning and the last of the evening:
     what the person sees and touches then shapes the whole day.
   - The place where they work or study, if it is at home: light coming
     from the right direction, chair height, screen height.
   - Where they eat, and whether it is possible to eat there at all.
   - Air, daylight and temperature — cheap to fix, rarely noticed.

3. ARRANGEMENT AND FLOW. Only after clearing. Where things live relative
   to where they are used; what is blocking a doorway or a path; whether
   furniture can be moved rather than bought. Prefer rearranging over
   purchasing, and say so — a plan that turns into a shopping list has
   failed.

4. WHAT THE HOME IS MADE OF. Gently and without preaching: cleaning
   products and what they leave in the air, plastic in the kitchen,
   scented products, materials in bedding. Frame as a gradual swap when
   things run out, never as throwing away what works.

Practical constraints to respect throughout: rented homes limit what can
be changed — favour reversible changes. Other people live there too;
never plan the removal of someone else's belongings. Budget is usually
small; most of this costs nothing.

Milestones should be rooms completed and specific improvements made, and
one of them should be the sleeping place, early.

When the person falls behind, keep the clearing going and postpone the
arrangement. Half-cleared is worse than not started, so never leave a
category open across a pause.
`.trim(),
    text: {
      cs: {
        title: "Proměna domova",
        pitch:
          "Nejde o úklid. Jde o to, aby tě domov po náročném dni skutečně spravil — a to se rozhoduje na pár místech, kterých si člověk obvykle nevšimne.",
        what: "Nejdřív očista po místnostech, pak místa, která rozhodují nejvíc — spaní, ráno, světlo, vzduch. Pak rozmístění věcí a nakonec postupná výměna toho, z čeho je domov udělaný.",
        forWhom:
          "Pro toho, kdo má pocit, že se doma úplně neodpočine, a neví, kde začít.",
        phases: [
          {
            when: "Nejdřív vyklidit",
            what: "Místnost po místnosti, kategorie po kategorii. Dokud je věcí moc, nedá se nic uspořádat. Součástí je i konec příběhu: kam ty věci půjdou, a termín pro krabice „ještě rozmyslet“, protože jinak zůstanou roky.",
          },
          {
            when: "Místa, která rozhodují, jak se člověk cítí",
            what: "Spánek: pohodlná postel, dost tma a ticho, stáří matrace, světélka v noci. Prvních deset minut rána a posledních večer. Místo, kde se pracuje. Kde se jí. Vzduch, denní světlo, teplota.",
          },
          {
            when: "Uspořádání a průchodnost",
            what: "Až po vyklizení. Kde věci bydlí vzhledem k tomu, kde se používají. Co překáží v cestě. Přesouvat se dává přednost před kupováním — plán, ze kterého je nákupní seznam, selhal.",
          },
          {
            when: "Z čeho je domov udělaný",
            what: "Úklidové prostředky a co po nich zůstává ve vzduchu, plasty v kuchyni, vonné věci, materiály v ložním prádle. Postupná výměna, až věci dojdou — ne vyhazování toho, co slouží.",
          },
        ],
        whenBehind: "Vyklízení pokračuje, uspořádání se odloží. Rozdělaná kategorie se nenechává přes pauzu — napůl vyklizeno je horší než nezačato.",
        goal: "Proměnit svůj domov v místo, kde si opravdu odpočinu",
        questions: [
          {
            id: "place",
            label: "Kde bydlíš?",
            hint: "velikost, kolik místností, byt nebo dům, vlastní nebo nájem",
          },
          {
            id: "who",
            label: "Kdo tam bydlí s tebou?",
            hint: "sám / partner / děti / zvířata — plán s tím počítá",
          },
          {
            id: "worst",
            label: "Co ti tam nejvíc vadí?",
            hint: "nepořádek / špatně se spí / tma / hluk / nemám kde pracovat",
          },
        ],
      },
      en: {
        title: "Transform your home",
        pitch:
          "This is not tidying. It is about a home that genuinely restores you after a hard day — and that is decided in a handful of places most people never notice.",
        what: "Clearing out room by room first, then the places that matter most — sleep, mornings, light, air. Then how things are arranged, and finally a gradual swap of what the home is made of.",
        forWhom:
          "For anyone who does not quite rest at home and does not know where to start.",
        phases: [
          {
            when: "Clear out first",
            what: "Room by room, category by category. Nothing can be arranged while there is too much stuff. That includes the end of the story: where things actually go, and a deadline for the boxes that are “still to be decided”, because otherwise they stay for years.",
          },
          {
            when: "The places that decide how you feel",
            what: "Sleep: a comfortable bed, dark and quiet enough, the age of the mattress, the little lights at night. The first ten minutes of the morning and the last of the evening. Where you work. Where you eat. Air, daylight, temperature.",
          },
          {
            when: "Arrangement and flow",
            what: "Only after clearing. Where things live relative to where they are used. What is blocking a path. Moving things is preferred to buying them — a plan that turns into a shopping list has failed.",
          },
          {
            when: "What the home is made of",
            what: "Cleaning products and what they leave in the air, plastic in the kitchen, scented things, the materials in bedding. A gradual swap as things run out — not throwing away what works.",
          },
        ],
        whenBehind: "Clearing carries on and the arranging is postponed. A category is never left open across a pause — half-cleared is worse than not started.",
        goal: "Turn my home into a place where I actually rest",
        questions: [
          {
            id: "place",
            label: "Where do you live?",
            hint: "size, how many rooms, flat or house, owned or rented",
          },
          {
            id: "who",
            label: "Who lives there with you?",
            hint: "alone / partner / children / animals — the plan accounts for it",
          },
          {
            id: "worst",
            label: "What bothers you most about it?",
            hint: "clutter / I sleep badly / too dark / noise / nowhere to work",
          },
        ],
      },
      de: {
        title: "Das Zuhause verwandeln",
        pitch:
          "Es geht nicht ums Aufräumen. Es geht um ein Zuhause, das dich nach einem harten Tag wirklich wiederherstellt — und das entscheidet sich an wenigen Stellen, die kaum jemand bemerkt.",
        what: "Zuerst ausmisten, Raum für Raum, dann die Orte, die am meisten zählen — Schlaf, Morgen, Licht, Luft. Dann die Anordnung und zuletzt der schrittweise Austausch dessen, woraus das Zuhause besteht.",
        forWhom:
          "Für alle, die sich zu Hause nicht richtig erholen und nicht wissen, wo sie anfangen sollen.",
        phases: [
          {
            when: "Zuerst ausräumen",
            what: "Raum für Raum, Kategorie für Kategorie. Solange zu viel da ist, lässt sich nichts ordnen. Dazu gehört auch das Ende der Geschichte: wohin die Dinge wirklich gehen, und eine Frist für die Kisten, die „noch zu entscheiden“ sind, sonst bleiben sie Jahre.",
          },
          {
            when: "Die Orte, die entscheiden, wie du dich fühlst",
            what: "Schlaf: ein wirklich bequemes Bett, dunkel und leise genug, das Alter der Matratze, die kleinen Lichter in der Nacht. Die ersten zehn Minuten des Morgens und die letzten des Abends. Wo du arbeitest. Wo du isst. Luft, Tageslicht, Temperatur.",
          },
          {
            when: "Anordnung und Wege",
            what: "Erst nach dem Ausräumen. Wo die Dinge wohnen, gemessen daran, wo sie benutzt werden. Was einen Weg versperrt. Umstellen hat Vorrang vor Kaufen — ein Plan, aus dem eine Einkaufsliste wird, ist gescheitert.",
          },
          {
            when: "Woraus das Zuhause gemacht ist",
            what: "Putzmittel und was sie in der Luft hinterlassen, Plastik in der Küche, Duftprodukte, Materialien in der Bettwäsche. Ein allmählicher Tausch, wenn Dinge aufgebraucht sind — nicht wegwerfen, was funktioniert.",
          },
        ],
        whenBehind: "Das Ausräumen geht weiter, das Ordnen wird verschoben. Eine Kategorie bleibt nie über eine Pause offen — halb ausgeräumt ist schlechter als gar nicht angefangen.",
        goal: "Mein Zuhause in einen Ort verwandeln, an dem ich wirklich ausruhe",
        questions: [
          {
            id: "place",
            label: "Wo wohnst du?",
            hint: "Größe, wie viele Zimmer, Wohnung oder Haus, Eigentum oder Miete",
          },
          {
            id: "who",
            label: "Wer wohnt mit dir dort?",
            hint: "allein / Partner / Kinder / Tiere — der Plan berücksichtigt das",
          },
          {
            id: "worst",
            label: "Was stört dich dort am meisten?",
            hint: "Unordnung / ich schlafe schlecht / zu dunkel / Lärm / kein Arbeitsplatz",
          },
        ],
      },
    },
  },
];
