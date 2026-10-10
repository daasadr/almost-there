import type { GoalTemplate } from "./index";

/**
 * Učení a tvorba.
 *
 * Dvě šablony, které mají společné to, že jde o **dovednost, ne
 * o znalost**. Číst o programování ani o kreslení nestačí a plán z toho
 * musí vycházet: většina úkolů je dělání, ne studium.
 */

export const learning: GoalTemplate[] = [
  {
    id: "vibecoder-to-coder",
    area: "learning",
    defaultMonths: 6,
    guidance: `
Going from building things with an AI assistant to actually
understanding the code. The person can already produce working software
— that is the starting point, and it is a real one. Do not plan for
someone who has never seen a program.

The gap is specific and worth naming: they can get code that runs but
cannot reliably tell why it runs, cannot debug when the assistant is
wrong, cannot judge whether a suggestion is good, and cannot hold the
shape of a system in their head. Everything in the plan should close one
of those four.

The method that works, and it is counter-intuitive: keep building with
the assistant, but add a rule — nothing gets committed that cannot be
explained line by line. Reading and explaining existing code is the
fastest route here, faster than writing from scratch.

Sequence the fundamentals in the order they bite:
1. Reading code and tracing execution by hand.
2. Debugging deliberately — reproducing, isolating, forming a hypothesis
   — instead of pasting the error back into the assistant.
3. The language's own model: types, scope, references, async.
4. Data and state: where truth lives, what can change it.
5. Judging a suggestion: spotting the version that works today and
   breaks in six months.

Include regular "no assistant" sessions, short and deliberate. Not as
punishment — as the only way to find out what is actually known.

Tests deserve a strand of their own: they are the fastest feedback a
learner can get and they force clear thinking about behaviour.

Milestones should be capabilities, not courses finished: fixed a bug the
assistant could not, explained a file to someone else, rejected a bad
suggestion and said why.

Using an AI chat is expected and good here — but with a hard boundary,
and the tasks must say it out loud. The chat explains principles, walks
through examples and asks test questions. It does not write the code
that goes into their own work, and the person should tell it so at the
start of the conversation. The whole goal is to be able to write it
themselves; help is fine, substitution defeats the point and they find
that out too late.

Build the whole plan around the stack they name. "Types, scope, async"
means the types, scope and async of THEIR language, and every example
should use what they are actually building with. A plan about
programming in general is one they will read and not do.

Plenty of them genuinely do not know what their project is made of —
the assistant chose it. If that is the answer, the first task is to find
out: open the project, go through what is in it, and name the language,
the framework and the runtime. That is not a detour. Not knowing what
you are working in is the same gap as not knowing why the code runs.

When the person falls behind, cut the theory and keep the building and
the explaining.
`.trim(),
    text: {
      cs: {
        title: "Od vibecodingu ke skutečnému programování",
        pitch:
          "Umíš s pomocí AI postavit funkční věc — a zároveň tušíš, že nerozumíš tomu, co ti vzniklo pod rukama. Tenhle plán tu mezeru zavírá a stavět přitom nepřestaneš.",
        what: "Staví dál s asistentem, ale s pravidlem: nic, co neumíš vysvětlit řádek po řádku. K tomu čtení cizího kódu, hledání chyb bez nápovědy a základy v pořadí, ve kterém doopravdy zaberou.",
        forWhom:
          "Pro toho, kdo už něco navibecodoval a nechce u toho zůstat. Včetně úplných začátečníků — dnes většina začíná právě takhle.",
        phases: [
          {
            when: "Číst kód a sledovat, co se v něm děje",
            what: "Vezmi soubor, který ti vygenerovala AI, a projdi ho řádek po řádku — nahlas nebo písemně. Co tenhle řádek dělá? Co by se stalo, kdyby tam nebyl? Vysvětlit hotový kód je rychlejší cesta k porozumění než psát od nuly. A platí tu pravidlo, na kterém stojí celý plán: co neumíš vysvětlit, to nejde dál.",
          },
          {
            when: "Hledat chyby po svém",
            what: "Zopakovat chybu, zúžit, kde přesně se děje, a mít domněnku proč — místo toho, aby hláška hned putovala zpátky do asistenta. Je to pomalejší přesně těch pár minut, ve kterých se to člověk naučí.",
          },
          {
            when: "Jak tvůj jazyk doopravdy funguje",
            what: "Typy, rozsah platnosti, odkazy, asynchronní běh — v tom, v čem stavíš, ne obecně. Pak data a stav: kde je uložená pravda a co ji může změnit. Tady se zpětně vysvětlí půlka věcí, které dřív „prostě fungovaly“.",
          },
          {
            when: "Poznat dobrý návrh od špatného",
            what: "Rozeznat verzi, která funguje dnes a za půl roku se rozsype. K tomu krátká sezení bez asistenta — ne jako trest, ale jako jediný způsob, jak zjistit, co opravdu umíš a co jen opisuješ.",
          },
        ],
        whenBehind: "Škrtá se teorie. Stavění a vysvětlování zůstávají — na těch dvou to celé stojí.",
        goal: "Od vibecodingu ke skutečnému porozumění kódu",
        questions: [
          {
            id: "stack",
            label: "V jakém jazyce a s čím stavíš?",
            hint: "třeba JavaScript, Next.js a Node.js — nebo Python, nebo klidně „nevím, co mi to AI nasadila“",
          },
          {
            id: "built",
            label: "Co už máš postavené?",
            hint: "krátce — co to dělá",
          },
          {
            id: "stuck",
            label: "Kde se nejčastěji zasekneš?",
            hint: "chyba, se kterou si asistent neví rady / nevím, proč to funguje / neumím to poskládat dohromady",
          },
          {
            id: "time",
            label: "Kolik času týdně na to máš?",
            hint: "počítej reálně, ne ideál",
          },
        ],
      },
      en: {
        title: "From vibecoding to actually coding",
        pitch:
          "You can build something that works with an AI assistant — and you suspect you do not understand what appeared under your hands. This closes that gap without asking you to stop building.",
        what: "Keep building with the assistant, under one rule: nothing you cannot explain line by line. Plus reading other people's code, debugging without help, and fundamentals in the order they actually bite.",
        forWhom:
          "For anyone who has vibecoded something and does not want to stop there. Complete beginners included — most people start this way now.",
        phases: [
          {
            when: "Read the code and follow what it does",
            what: "Take a file the assistant generated and go through it line by line, out loud or in writing. What does this line do? What would break without it? Explaining finished code is a faster route to understanding than writing from scratch. And the rule the whole plan rests on applies here: what you cannot explain does not go further.",
          },
          {
            when: "Find the bug yourself",
            what: "Reproduce it, narrow down where it happens, form a hypothesis about why — instead of the error going straight back into the assistant. It is slower by exactly the few minutes in which you learn it.",
          },
          {
            when: "How your language actually works",
            what: "Types, scope, references, async — in what you are building with, not in the abstract. Then data and state: where the truth lives and what can change it. This is where half the things that used to “just work” get explained in hindsight.",
          },
          {
            when: "Tell a good suggestion from a bad one",
            what: "Spot the version that works today and breaks in six months. Plus short sessions with no assistant — not as punishment, but as the only way to find out what you actually know and what you are copying.",
          },
        ],
        whenBehind: "Theory gets cut. Building and explaining stay — the whole thing rests on those two.",
        goal: "Go from vibecoding to actually understanding code",
        questions: [
          {
            id: "stack",
            label: "What language and tools are you building with?",
            hint: "JavaScript with Next.js and Node.js, say — or Python, or honestly “no idea, the assistant picked it”",
          },
          {
            id: "built",
            label: "What have you built?",
            hint: "briefly — what it does",
          },
          {
            id: "stuck",
            label: "Where do you get stuck most often?",
            hint: "a bug the assistant cannot solve / I don't know why it works / I can't hold it together",
          },
          {
            id: "time",
            label: "How many hours a week do you have?",
            hint: "realistically, not the ideal",
          },
        ],
      },
      de: {
        title: "Vom Vibecoding zum echten Programmieren",
        pitch:
          "Du bekommst mit einem KI-Assistenten etwas Funktionierendes hin — und ahnst zugleich, dass du nicht verstehst, was da unter deinen Händen entstanden ist. Das schließt diese Lücke, ohne dass du aufhören musst zu bauen.",
        what: "Weiterbauen mit dem Assistenten, aber mit einer Regel: nichts, was du nicht Zeile für Zeile erklären kannst. Dazu fremden Code lesen, Fehler ohne Hilfe suchen und Grundlagen in der Reihenfolge, in der sie wirklich zubeißen.",
        forWhom:
          "Für alle, die schon etwas zusammenvibecodet haben und nicht dabei stehen bleiben wollen. Auch für Anfänger — heute fangen die meisten so an.",
        phases: [
          {
            when: "Den Code lesen und verfolgen, was er tut",
            what: "Nimm eine Datei, die dir der Assistent erzeugt hat, und geh sie Zeile für Zeile durch — laut oder schriftlich. Was macht diese Zeile? Was ginge kaputt ohne sie? Fertigen Code zu erklären führt schneller zum Verstehen als von null zu schreiben. Und die Regel, auf der der ganze Plan steht, gilt hier: was du nicht erklären kannst, geht nicht weiter.",
          },
          {
            when: "Den Fehler selbst finden",
            what: "Reproduzieren, eingrenzen, wo genau es passiert, und eine Vermutung bilden, warum — statt dass die Meldung sofort zurück in den Assistenten wandert. Es ist genau um die paar Minuten langsamer, in denen man es lernt.",
          },
          {
            when: "Wie deine Sprache tatsächlich funktioniert",
            what: "Typen, Gültigkeitsbereich, Referenzen, Asynchronität — in dem, womit du baust, nicht im Allgemeinen. Dann Daten und Zustand: wo die Wahrheit liegt und was sie ändern kann. Hier erklärt sich im Nachhinein die Hälfte der Dinge, die vorher „einfach liefen“.",
          },
          {
            when: "Einen guten Vorschlag von einem schlechten unterscheiden",
            what: "Die Variante erkennen, die heute läuft und in einem halben Jahr zerbricht. Dazu kurze Einheiten ohne Assistenten — nicht als Strafe, sondern als einziger Weg herauszufinden, was du wirklich kannst und was du nur abschreibst.",
          },
        ],
        whenBehind: "Die Theorie wird gestrichen. Bauen und Erklären bleiben — darauf steht das Ganze.",
        goal: "Vom Vibecoding dahin, Code wirklich zu verstehen",
        questions: [
          {
            id: "stack",
            label: "In welcher Sprache und womit baust du?",
            hint: "zum Beispiel JavaScript mit Next.js und Node.js — oder Python, oder ehrlich „keine Ahnung, das hat der Assistent ausgesucht“",
          },
          {
            id: "built",
            label: "Was hast du schon gebaut?",
            hint: "kurz — was es tut",
          },
          {
            id: "stuck",
            label: "Wo bleibst du am häufigsten hängen?",
            hint: "ein Fehler, den der Assistent nicht löst / ich weiß nicht, warum es funktioniert / ich kriege es nicht zusammen",
          },
          {
            id: "time",
            label: "Wie viele Stunden pro Woche hast du?",
            hint: "realistisch, nicht der Idealfall",
          },
        ],
      },
    },
  },

  {
    id: "drawing-boost",
    area: "learning",
    defaultMonths: 3,
    guidance: `
A concentrated push in drawing and creative ability. The premise, which
is well founded: daily practice produces visible change within the first
two weeks, and that early change is what keeps the habit alive.

Build the plan around a short daily session that is genuinely daily —
frequency beats duration here by a wide margin. Twenty focused minutes
every day outperforms three hours on Sunday.

Structure each week around a theme rather than random practice:
observation from life, gesture and movement, value and light, shape
before detail, composition, colour if relevant. Rotate, then return —
the second pass at a theme is where it lands.

Put drawing from life or photograph reference above drawing from
imagination in the early weeks. Imagination draws from a library the
person has not built yet.

Include deliberately unpolished work: timed sketches, filling a page
without erasing, deliberately bad drawings. Perfectionism is the main
thing that stops daily practice, and it has to be designed out.

Comparison is the second thing that stops it. Build in a task to look
back at work from two and four weeks earlier — that is where the
evidence of progress lives, not in today's page.

Include sharing at a mild level if the person wants it: posting some of
the work changes how it is approached and creates accountability.

Milestones are volume and range — pages filled, subjects attempted —
plus one finished piece at the end that they would show someone.

When the person falls behind, shorten the session but keep the day.
Breaking the chain costs more than a short session.
`.trim(),
    text: {
      cs: {
        title: "Skok v kreslení a kreativitě",
        pitch:
          "Změna je vidět dřív, než čekáš — u každodenního kreslení už po dvou týdnech. Nejde o talent, jde o to, aby se to dělo každý den a mělo to pořadí.",
        what: "Krátké denní kreslení v týdenních tématech: pozorování, pohyb, světlo, tvar, kompozice. Včetně cvičení naschvál nedokonalých, protože perfekcionismus je to, co tohle nejčastěji utne.",
        forWhom:
          "Pro toho, kdo chce v kreslení skokově povyrůst — od úplného začátku i od rozkoukané úrovně.",
        phases: [
          {
            when: "Krátce, ale opravdu každý den",
            what: "Dvacet soustředěných minut denně předčí tři hodiny v neděli. Četnost tu poráží délku na celé čáře.",
          },
          {
            when: "Každý týden jedno téma",
            what: "Pozorování podle skutečnosti, gesto a pohyb, světlo a valéry, tvar před detailem, kompozice. Témata se střídají a pak vracejí — teprve napodruhé to sedne.",
          },
          {
            when: "Záměrně nedokonalá práce",
            what: "Kresby na čas, zaplnit stránku bez gumování, schválně špatné kresby. Perfekcionismus je hlavní věc, která denní kreslení zabíjí, a musí se z plánu vyřadit předem.",
          },
          {
            when: "Ohlédnout se po dvou a čtyřech týdnech",
            what: "Důkaz o pokroku není v dnešní kresbě, ale ve srovnání se starší. Na konci jedna dotažená práce, kterou je co ukázat.",
          },
        ],
        whenBehind: "Zkrátí se sezení, ale den se nevynechá. Přetržený řetěz stojí víc než krátké kreslení.",
        goal: "Zvednout své kreslení a kreativitu intenzivní denní praxí",
        questions: [
          {
            id: "level",
            label: "Kde v kreslení teď jsi?",
            hint: "nekreslím / občas si čmárám / kreslím a chci dál",
          },
          {
            id: "minutes",
            label: "Kolik minut denně tomu můžeš dát?",
            hint: "radši míň a každý den než hodně a jednou týdně",
          },
          {
            id: "want",
            label: "Co chceš umět nakreslit?",
            hint: "lidi, zvířata, krajina, věci kolem, vlastní příběhy",
          },
        ],
      },
      en: {
        title: "A leap in drawing and creativity",
        pitch:
          "The change shows up sooner than you expect — with daily drawing, inside two weeks. This is not about talent. It is about doing it every day, in an order that works.",
        what: "A short daily session with weekly themes: observation, gesture, light, shape, composition. Including deliberately rough exercises, because perfectionism is what usually ends this.",
        forWhom:
          "For anyone who wants a step change in their drawing — from scratch or from somewhere in the middle.",
        phases: [
          {
            when: "Short, but genuinely every day",
            what: "Twenty focused minutes a day beats three hours on Sunday. Frequency wins over duration here by a wide margin.",
          },
          {
            when: "One theme a week",
            what: "Observation from life, gesture and movement, light and value, shape before detail, composition. Themes rotate and then come back — the second pass is where it lands.",
          },
          {
            when: "Deliberately unpolished work",
            what: "Timed sketches, filling a page without erasing, deliberately bad drawings. Perfectionism is the main thing that kills daily practice, and it has to be designed out in advance.",
          },
          {
            when: "Look back after two and four weeks",
            what: "The evidence of progress is not in today's page but in the comparison with an older one. At the end, one finished piece worth showing someone.",
          },
        ],
        whenBehind: "Shorten the session but do not skip the day. Breaking the chain costs more than a short sitting.",
        goal: "Raise my drawing and creativity through intensive daily practice",
        questions: [
          {
            id: "level",
            label: "Where are you with drawing now?",
            hint: "I don't draw / I doodle sometimes / I draw and want more",
          },
          {
            id: "minutes",
            label: "How many minutes a day can you give it?",
            hint: "less every day beats a lot once a week",
          },
          {
            id: "want",
            label: "What would you like to be able to draw?",
            hint: "people, animals, landscape, things around you, your own stories",
          },
        ],
      },
      de: {
        title: "Ein Sprung im Zeichnen und in der Kreativität",
        pitch:
          "Die Veränderung zeigt sich früher, als du denkst — beim täglichen Zeichnen innerhalb von zwei Wochen. Es geht nicht um Talent, sondern darum, dass es jeden Tag passiert und eine Reihenfolge hat.",
        what: "Eine kurze tägliche Einheit mit Wochenthemen: Beobachtung, Bewegung, Licht, Form, Komposition. Samt absichtlich unfertiger Übungen, denn Perfektionismus beendet das meistens.",
        forWhom:
          "Für alle, die im Zeichnen einen Sprung machen wollen — von null oder von irgendwo dazwischen.",
        phases: [
          {
            when: "Kurz, aber wirklich jeden Tag",
            what: "Zwanzig konzentrierte Minuten täglich schlagen drei Stunden am Sonntag. Häufigkeit gewinnt hier deutlich gegen Dauer.",
          },
          {
            when: "Ein Thema pro Woche",
            what: "Beobachtung nach der Natur, Geste und Bewegung, Licht und Helligkeitswerte, Form vor Detail, Komposition. Die Themen wechseln und kommen wieder — beim zweiten Durchgang sitzt es.",
          },
          {
            when: "Absichtlich unfertige Arbeiten",
            what: "Skizzen auf Zeit, eine Seite füllen ohne zu radieren, absichtlich schlechte Zeichnungen. Perfektionismus ist das Hauptproblem beim täglichen Üben und muss vorher aus dem Plan herausgeplant werden.",
          },
          {
            when: "Nach zwei und vier Wochen zurückschauen",
            what: "Der Beweis für Fortschritt steckt nicht in der heutigen Seite, sondern im Vergleich mit einer älteren. Am Ende eine fertige Arbeit, die du jemandem zeigen würdest.",
          },
        ],
        whenBehind: "Die Einheit wird kürzer, der Tag fällt nicht aus. Eine unterbrochene Kette kostet mehr als eine kurze Sitzung.",
        goal: "Mein Zeichnen und meine Kreativität durch tägliche Praxis heben",
        questions: [
          {
            id: "level",
            label: "Wo stehst du beim Zeichnen gerade?",
            hint: "ich zeichne nicht / ich kritzele manchmal / ich zeichne und will weiter",
          },
          {
            id: "minutes",
            label: "Wie viele Minuten täglich kannst du dafür aufbringen?",
            hint: "lieber wenig jeden Tag als viel einmal die Woche",
          },
          {
            id: "want",
            label: "Was möchtest du zeichnen können?",
            hint: "Menschen, Tiere, Landschaft, Dinge um dich, eigene Geschichten",
          },
        ],
      },
    },
  },
];
