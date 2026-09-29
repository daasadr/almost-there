import type { GoalTemplate } from "./index";

/**
 * Zdraví a tělo.
 *
 * Dvojice ve dvou místech schválně: maraton i půlmaraton, hubnutí
 * i změna jídelníčku. Jsou to blízká témata, ale **jiní lidé** — a plán
 * pro ně vypadá jinak od prvního týdne. Kdo chce zhubnout, potřebuje
 * jiné úkoly než ten, komu na váze nesejde a chce jen jíst líp.
 *
 * Pozor na jednu věc u celé téhle oblasti: plán se nesmí tvářit jako
 * lékařská rada. Pokyny pro model to hlídají.
 */

const MEDICAL_CAUTION = `
This plan is not medical advice. Do not diagnose, do not prescribe
supplements or medication, and do not set targets that require medical
supervision. Where a condition, injury, pregnancy, medication or a
history of disordered eating could matter, put a real task in the plan
early: talk to a doctor before going further. Say it once, plainly, and
then get on with planning.
`.trim();

export const health: GoalTemplate[] = [
  {
    id: "marathon",
    area: "health",
    defaultMonths: 6,
    guidance: `
Training for a first marathon, from a runner who already runs but has
never gone this far.

${MEDICAL_CAUTION}

The plan is built on weekly volume, not on daily heroics. Structure it
as: a long run once a week that grows slowly, two or three easy runs,
and at least one full rest day. Most running must be genuinely easy —
conversational pace. Beginners run their easy runs too fast and that is
the single biggest reason they get injured or stall.

Grow weekly volume gradually and include a lighter week roughly every
fourth week. Recovery weeks are not lost time; they are where adaptation
happens. Put them in the plan explicitly so they do not feel like
failure.

The longest run before the race does not need to be the full distance.
Plan a taper: a real reduction in the last two to three weeks, which
will feel wrong and must be explained.

Include the unglamorous parts as tasks: shoes that fit and are not worn
out, practising race-day food and drink on long runs rather than on the
day, and a plan for what to do when a run has to be skipped.

Milestones should be distances reached and a mid-plan race at a shorter
distance, not weight or appearance.

When the person falls behind, cut the easy runs and protect the long run
and the rest day. Never compress the build-up to catch up — that is how
the goal ends in injury instead of a finish line.
`.trim(),
    text: {
      cs: {
        title: "Natrénovat na maraton",
        pitch:
          "Čtyřicet dva kilometrů je meta, které rozumí každý. Nedotáhne ji odhodlání, ale poctivě rostoucí týdenní objem — a ten se dá naplánovat.",
        what: "Postaví týdenní rytmus s dlouhým během, lehkými kilometry a odpočinkem, s postupným růstem a odlehčenými týdny. Včetně zúžení před závodem.",
        forWhom:
          "Pro toho, kdo už nějak běhá a chce poprvé zvládnout celý maraton.",
        goal: "Natrénovat a doběhnout maraton",
        questions: [
          {
            id: "current",
            label: "Kolik toho teď uběhneš?",
            hint: "kolikrát týdně a nejdelší běh za poslední měsíc",
          },
          {
            id: "days",
            label: "Kolik dní v týdnu můžeš běhat?",
            hint: "počítej reálně, i s prací a rodinou",
          },
          {
            id: "history",
            label: "Máš za sebou nějaké zranění nebo omezení?",
            hint: "kolena, achilovka, záda, nic",
          },
        ],
      },
      en: {
        title: "Train for a marathon",
        pitch:
          "Forty-two kilometres is a benchmark everyone understands. It is not finished on determination but on weekly volume that grows honestly — and that can be planned.",
        what: "Builds a weekly rhythm of one long run, easy miles and real rest, with gradual build-up, recovery weeks and a proper taper.",
        forWhom:
          "For anyone who already runs and wants to cover the full distance for the first time.",
        goal: "Train for and finish a marathon",
        questions: [
          {
            id: "current",
            label: "How much do you run now?",
            hint: "times per week and your longest run this month",
          },
          {
            id: "days",
            label: "How many days a week can you run?",
            hint: "count realistically, around work and family",
          },
          {
            id: "history",
            label: "Any injuries or limitations?",
            hint: "knees, Achilles, back, none",
          },
        ],
      },
      de: {
        title: "Für einen Marathon trainieren",
        pitch:
          "Zweiundvierzig Kilometer sind eine Marke, die jeder versteht. Sie wird nicht durch Entschlossenheit geschafft, sondern durch ehrlich wachsenden Wochenumfang — und der lässt sich planen.",
        what: "Baut einen Wochenrhythmus aus einem langen Lauf, lockeren Kilometern und echter Erholung, mit langsamem Aufbau, Entlastungswochen und richtigem Tapering.",
        forWhom:
          "Für alle, die schon laufen und die volle Distanz zum ersten Mal schaffen wollen.",
        goal: "Für einen Marathon trainieren und ihn finishen",
        questions: [
          {
            id: "current",
            label: "Wie viel läufst du derzeit?",
            hint: "wie oft pro Woche und dein längster Lauf im letzten Monat",
          },
          {
            id: "days",
            label: "An wie vielen Tagen pro Woche kannst du laufen?",
            hint: "rechne realistisch, mit Arbeit und Familie",
          },
          {
            id: "history",
            label: "Gibt es Verletzungen oder Einschränkungen?",
            hint: "Knie, Achillessehne, Rücken, keine",
          },
        ],
      },
    },
  },

  {
    id: "half-marathon",
    area: "health",
    defaultMonths: 4,
    guidance: `
Training for a first half marathon. Often the first serious running goal
someone sets, and frequently the person is close to a beginner.

${MEDICAL_CAUTION}

Twenty-one kilometres is reachable from a modest base, which changes the
shape of the plan: the early weeks are about building the habit of
running several times a week at all, not about volume. If the person
currently runs rarely or not at all, start with run-walk intervals and
say so without embarrassment — it is the fastest safe way in.

Then: one longer run a week that grows steadily, two easy runs, at least
one rest day, and a lighter week roughly every fourth. Easy runs must be
easy; the most common beginner mistake is running every run at the same
moderately hard pace and stalling.

Unlike the marathon, the longest training run can reach close to race
distance, which is worth doing for confidence.

Keep a short taper of about a week and explain why it feels wrong.

Include practical tasks: shoes, what to wear in bad weather, and what to
do about a missed week — because there will be one.

Milestones are distances and time on feet, not pace. Finishing is the
goal; a time target can come the second time round.

When the person falls behind, keep the long run and the rest day and
drop an easy run.
`.trim(),
    text: {
      cs: {
        title: "Natrénovat na půlmaraton",
        pitch:
          "Dvacet jedna kilometrů je nejlepší první velký běžecký cíl: dost daleko na to, aby se to počítalo, a dost blízko na to, aby se to dalo zvládnout za pár měsíců.",
        what: "Nastaví postupný růst od toho, co uběhneš dnes — klidně i od střídání běhu s chůzí — až po závodní vzdálenost, s odpočinkem v plánu.",
        forWhom:
          "Pro začínající i pro toho, kdo občas běhá a chce si poprvé sáhnout na skutečný závod.",
        goal: "Natrénovat a doběhnout půlmaraton",
        questions: [
          {
            id: "current",
            label: "Kolik toho teď uběhneš?",
            hint: "klidně i „skoro nic“ — plán se tomu přizpůsobí",
          },
          {
            id: "days",
            label: "Kolik dní v týdnu můžeš běhat?",
            hint: "počítej reálně",
          },
          {
            id: "history",
            label: "Máš za sebou nějaké zranění nebo omezení?",
            hint: "kolena, achilovka, záda, nic",
          },
        ],
      },
      en: {
        title: "Train for a half marathon",
        pitch:
          "Twenty-one kilometres is the best first big running goal: far enough that it counts, close enough that a few months will get you there.",
        what: "Builds gradually from wherever you are today — run-walk intervals are a fine start — up to race distance, with rest written into the plan.",
        forWhom:
          "For beginners and for occasional runners wanting their first real race.",
        goal: "Train for and finish a half marathon",
        questions: [
          {
            id: "current",
            label: "How much do you run now?",
            hint: "“almost nothing” is a fine answer — the plan adapts",
          },
          {
            id: "days",
            label: "How many days a week can you run?",
            hint: "count realistically",
          },
          {
            id: "history",
            label: "Any injuries or limitations?",
            hint: "knees, Achilles, back, none",
          },
        ],
      },
      de: {
        title: "Für einen Halbmarathon trainieren",
        pitch:
          "Einundzwanzig Kilometer sind das beste erste große Laufziel: weit genug, dass es zählt, nah genug, dass ein paar Monate reichen.",
        what: "Baut schrittweise von deinem heutigen Stand auf — Laufen im Wechsel mit Gehen ist ein guter Anfang — bis zur Wettkampfdistanz, mit Erholung im Plan.",
        forWhom:
          "Für Einsteiger und für Gelegenheitsläufer, die ihren ersten echten Wettkampf wollen.",
        goal: "Für einen Halbmarathon trainieren und ihn finishen",
        questions: [
          {
            id: "current",
            label: "Wie viel läufst du derzeit?",
            hint: "„fast nichts“ ist eine gute Antwort — der Plan passt sich an",
          },
          {
            id: "days",
            label: "An wie vielen Tagen pro Woche kannst du laufen?",
            hint: "rechne realistisch",
          },
          {
            id: "history",
            label: "Gibt es Verletzungen oder Einschränkungen?",
            hint: "Knie, Achillessehne, Rücken, keine",
          },
        ],
      },
    },
  },

  {
    id: "healthy-weight",
    area: "health",
    defaultMonths: 6,
    guidance: `
Losing weight in a way that holds.

${MEDICAL_CAUTION} Be especially careful here: if the person's answers
suggest a history of disordered eating, keep the plan away from counting
and weighing entirely and build it around habits and regular meals
instead.

Build the plan on habits, not on a diet. Diets end; habits are what is
left afterwards, and the whole point is the weight staying off. Most
tasks should be about what gets eaten, when and how it gets prepared —
not about restriction.

Sequence that works: first make meals regular, then improve what is in
them, then look at portions. Starting with restriction produces two good
weeks and a collapse.

Include shopping and cooking as real tasks. Most of the outcome is
decided in the shop, not at the table.

Add movement, but modestly and as its own strand — walking counts.
Do not turn this into a training plan.

Rate of change should be slow. Say it plainly: slow is the version that
holds, fast is the version that comes back.

Measure by behaviour, not only by the scale: meals cooked, days with
enough protein and vegetables, steps. Weight moves unevenly and a plan
that rewards only the number will be abandoned in the first flat week.
Plan for that flat week in advance and say it will come.

When the person falls behind, keep the regular meals and drop everything
else first.
`.trim(),
    text: {
      cs: {
        title: "Zdravě zhubnout",
        pitch:
          "Diety fungují, dokud trvají — a pak se váha vrátí. Tenhle plán staví na návycích, které zůstanou i potom, protože o to celé jde.",
        what: "Nejdřív srovná pravidelnost jídla, pak jeho obsah, teprve nakonec porce. K tomu nákupy, vaření a pohyb — a měří se podle chování, ne jen podle váhy.",
        forWhom:
          "Pro toho, kdo chce zhubnout a udržet to, a má za sebou pár pokusů, které nevydržely.",
        goal: "Zdravě zhubnout a udržet si to",
        questions: [
          {
            id: "situation",
            label: "Jak dnes jíš?",
            hint: "vaříš / kupuješ hotové / jíš nepravidelně",
          },
          {
            id: "movement",
            label: "Jak se hýbeš?",
            hint: "sedavá práce / chodím / sportuji",
          },
          {
            id: "blocker",
            label: "Co ti to obvykle zhatí?",
            hint: "večerní chutě / nestíhám vařit / stres / společnost",
          },
        ],
      },
      en: {
        title: "Lose weight in a way that lasts",
        pitch:
          "Diets work while they last — and then the weight comes back. This plan is built on habits that stay afterwards, because that is the whole point.",
        what: "Regular meals first, then what is in them, portions last. Plus shopping, cooking and movement — measured by behaviour, not only by the scale.",
        forWhom:
          "For anyone who wants to lose weight and keep it off, with a few attempts behind them that did not hold.",
        goal: "Lose weight in a way that lasts",
        questions: [
          {
            id: "situation",
            label: "How do you eat today?",
            hint: "I cook / I buy ready meals / I eat irregularly",
          },
          {
            id: "movement",
            label: "How do you move?",
            hint: "desk job / I walk / I train",
          },
          {
            id: "blocker",
            label: "What usually derails it?",
            hint: "evening cravings / no time to cook / stress / company",
          },
        ],
      },
      de: {
        title: "Gesund abnehmen und es halten",
        pitch:
          "Diäten wirken, solange sie dauern — danach kommt das Gewicht zurück. Dieser Plan baut auf Gewohnheiten, die bleiben, denn darum geht es.",
        what: "Erst regelmäßige Mahlzeiten, dann ihr Inhalt, zuletzt die Portionen. Dazu Einkaufen, Kochen und Bewegung — gemessen am Verhalten, nicht nur an der Waage.",
        forWhom:
          "Für alle, die abnehmen und es halten wollen und schon ein paar Versuche hinter sich haben.",
        goal: "Gesund abnehmen und das Gewicht halten",
        questions: [
          {
            id: "situation",
            label: "Wie isst du heute?",
            hint: "ich koche / ich kaufe Fertiges / ich esse unregelmäßig",
          },
          {
            id: "movement",
            label: "Wie bewegst du dich?",
            hint: "Bürojob / ich gehe viel / ich treibe Sport",
          },
          {
            id: "blocker",
            label: "Was bringt es meist zum Kippen?",
            hint: "Heißhunger abends / keine Zeit zum Kochen / Stress / Gesellschaft",
          },
        ],
      },
    },
  },

  {
    id: "better-eating",
    area: "health",
    defaultMonths: 4,
    guidance: `
Moving to better food, with no weight target. This person is not trying
to be smaller — they want to stop eating industrially processed food and
start choosing deliberately. Do not smuggle weight loss into the plan
and do not mention it as a benefit.

${MEDICAL_CAUTION}

Build it as a gradual replacement, category by category, rather than an
overhaul. One category at a time, made permanent before the next: bread,
breakfast, drinks, snacks, sauces and dressings, ready meals. A category
that has been genuinely replaced does not come back.

Most of the outcome is decided in the shop. Make label-reading a real
skill with real tasks: recognising added sugar under its many names,
seeing how many ingredients a thing really has, noticing which items in
the usual basket are the processed ones.

Cooking capacity is the limit, so build it deliberately: a small
repertoire of dishes that can be made tired, batch cooking, and a
default plan for the evening when there is nothing ready.

Include the social side — eating out, family who cook differently,
being a guest. A plan that only works at home fails in the second month.

Measure by what is in the kitchen and what was cooked, not by purity.
Explicitly allow ordinary exceptions; all-or-nothing is what ends these
attempts.

When the person falls behind, hold the categories already replaced and
postpone the next one.
`.trim(),
    text: {
      cs: {
        title: "Přejít na zdravější stravu",
        pitch:
          "Nejde o hubnutí. Jde o to přestat jíst to, co za nás vybral průmysl — v době, kdy je celý regál plný věcí, které jídlo jen připomínají.",
        what: "Vyměňuje jednu kategorii po druhé — pečivo, snídaně, nápoje, svačiny — a natrvalo. K tomu čtení etiket, zásoba jídel na unavené večery a řešení návštěv.",
        forWhom:
          "Pro toho, komu na váze nesejde, ale došlo mu, že si chce vybírat vědomě.",
        goal: "Přejít na zdravější a méně zpracovanou stravu",
        questions: [
          {
            id: "situation",
            label: "Jak dnes jíš?",
            hint: "vaříš / kupuješ hotové / jak kdy",
          },
          {
            id: "cooking",
            label: "Kolik toho umíš uvařit a kolik na to máš času?",
            hint: "buď upřímný, plán se tomu přizpůsobí",
          },
          {
            id: "household",
            label: "Vaříš jen pro sebe?",
            hint: "sám / partner / děti — každý to mění jinak",
          },
        ],
      },
      en: {
        title: "Move to better food",
        pitch:
          "This is not about losing weight. It is about no longer eating what the industry chose for you, at a time when whole aisles are filled with things that merely resemble food.",
        what: "Replaces one category at a time — bread, breakfast, drinks, snacks — and makes it stick. Plus label reading, a store of meals for tired evenings, and what to do as a guest.",
        forWhom:
          "For anyone who does not care about the scale but has realised they want to choose deliberately.",
        goal: "Move to better, less processed food",
        questions: [
          {
            id: "situation",
            label: "How do you eat today?",
            hint: "I cook / I buy ready meals / it varies",
          },
          {
            id: "cooking",
            label: "How much can you cook, and how much time do you have?",
            hint: "be honest, the plan adapts",
          },
          {
            id: "household",
            label: "Are you cooking only for yourself?",
            hint: "alone / partner / children — each changes it",
          },
        ],
      },
      de: {
        title: "Auf besseres Essen umsteigen",
        pitch:
          "Es geht nicht ums Abnehmen. Es geht darum, nicht mehr das zu essen, was die Industrie ausgesucht hat — in einer Zeit, in der ganze Regale mit Dingen gefüllt sind, die Essen nur ähneln.",
        what: "Ersetzt eine Kategorie nach der anderen — Brot, Frühstück, Getränke, Snacks — und zwar dauerhaft. Dazu Etiketten lesen, Vorrat für müde Abende und der Umgang mit Einladungen.",
        forWhom:
          "Für alle, denen die Waage egal ist, die aber bewusst wählen wollen.",
        goal: "Auf besseres, weniger verarbeitetes Essen umsteigen",
        questions: [
          {
            id: "situation",
            label: "Wie isst du heute?",
            hint: "ich koche / ich kaufe Fertiges / mal so, mal so",
          },
          {
            id: "cooking",
            label: "Wie viel kannst du kochen und wie viel Zeit hast du?",
            hint: "sei ehrlich, der Plan passt sich an",
          },
          {
            id: "household",
            label: "Kochst du nur für dich?",
            hint: "allein / Partner / Kinder — das ändert jeweils viel",
          },
        ],
      },
    },
  },
];
