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
Going from building things with an AI assistant to actually being able to
build them. The person can already get working software out of an
assistant — that is the starting point and it is a real one. Do not plan
for someone who has never seen a program, and do not start at "Hello
World" theory.

They tell you which of two routes they want, and it changes the whole
plan:

ROUTE A, BUILD SOMETHING NEW (the default, and the better one for most).
They build one real application from nothing to a working base, and keep
going from there. This is a construction plan, not a syllabus. Theory
appears only when the thing they are building needs it, and never more
than a week ahead of that need.

ROUTE B, UNDERSTAND WHAT ALREADY EXISTS. They work through code they
already produced with an assistant until they can account for all of it.
Choose this only if they ask for it.

Most people are best served by a mix weighted heavily to A: build new,
and raid the old project for comparison when something is unclear.

For ROUTE A, sequence it like this:

1. Something that runs, in the first few days. The smallest thing that
   starts, shows something and is in version control. Not three weeks of
   setup, tooling and folder structure — that is where this kind of plan
   dies. If they can deploy it somewhere public in week one, better.
2. Then one capability at a time, each one whole. Show something. Take
   input. Store it. Read it back. Show what happens when it fails. Each
   of those goes through the entire stack, top to bottom. Do not plan by
   layers — a week of "the database", then a week of "the API" — because
   nothing works until the end and nothing is learned in between.
3. Each capability gets the theory it needs, right then. Storing data is
   when you learn how data is shaped and where the truth lives. Handling
   input is when you learn validation and why you never trust it.
4. Later: the same application, but harder. Authentication, a second kind
   of user, something that runs on a schedule, something that costs money
   if it goes wrong.

The rule that makes this learning and not more vibecoding, and it has to
be in the tasks out loud: THEY WRITE THE CODE. The assistant explains,
answers questions, reviews what they wrote and suggests what to read. It
does not produce the code that goes into their project. They should say
this to the chat at the start of each session. Help is fine;
substitution defeats the whole thing, and they find out too late.

Build in regular short sessions with no assistant at all. Not as
punishment — as the only way to find out what they actually know.

Debugging is its own strand from early on. Reproduce it, narrow down
where it happens, form a guess about why, and only then look it up.
Pasting the error straight back into the assistant is the single habit
that keeps people where they are.

Tutorials deserve a warning. Following along feels productive and teaches
very little, because the hard part — deciding what to do next — is done
for you. If a tutorial is used, the task is to close it afterwards and
rebuild the same thing without it.

Version control from the first week, with real commit messages. Tests as
soon as there is anything worth breaking; they are the fastest feedback
a learner can get.

Milestones are capabilities, not chapters: a working page they wrote
themselves, data that survives a restart, a bug they found and fixed
unaided, a feature added without the assistant touching the code.

When the person falls behind, cut the new features and the reading. Keep
the building and keep the sessions without the assistant.
`.trim(),
    text: {
      cs: {
        title: "Od vibecodingu ke skutečnému programování",
        pitch:
          "Umíš s pomocí AI postavit funkční věc — a zároveň tušíš, že od nuly a bez ní by to dohromady nešlo. Tenhle plán tě provede stavbou jedné vlastní aplikace od prvního souboru po funkční základ, s pravidlem, že kód píšeš ty.",
        what: "Postaví s tebou jednu aplikaci od nuly: nejdřív něco, co běží, pak jednu schopnost po druhé, celou odshora dolů. Teorie přichází vždycky až s tím, co zrovna potřebuješ. Asistent vysvětluje a kontroluje, ale kód píšeš ty.",
        forWhom:
          "Pro toho, kdo už něco navibecodoval a nechce u toho zůstat. Včetně úplných začátečníků — dnes většina začíná právě takhle. Kdo chce místo stavby nové věci porozumět tomu, co už má, dostane plán i na to.",
        phases: [
          {
            when: "Hned první dny něco, co běží",
            what: "Ne tři týdny zakládání, nastavování a rovnání složek — přesně tam tyhle plány umírají. Nejmenší věc, která se spustí, něco ukáže a je ve verzování. Když ji první týden dostaneš i někam ven, tím líp.",
          },
          {
            when: "Jedna schopnost po druhé, vždycky celá",
            what: "Něco ukázat. Přijmout, co uživatel zadá. Uložit to. Přečíst zpátky. Ukázat, co se stane, když to selže. Každá z nich projde celou aplikací odshora dolů — ne týden na databázi a pak týden na rozhraní, protože při tom nic nefunguje až do konce a cestou se nic nenaučíš.",
          },
          {
            when: "Teorie až ve chvíli, kdy je k něčemu",
            what: "Ukládání dat je ta chvíle, kdy se učíš, jak data vypadají a kde je uložená pravda. Přijímání vstupu je ta chvíle na ověřování a na to, proč se vstupu nikdy nevěří. Nikdy víc než týden napřed před tím, k čemu to potřebuješ.",
          },
          {
            when: "Kód píšeš ty, asistent vysvětluje",
            what: "Tohle je celý rozdíl mezi učením a dalším vibecodingem. Asistent odpovídá, vysvětluje a kontroluje tvůj kód — ale nepíše ten,  který ti jde do projektu. Řekni mu to na začátku každého sezení. K tomu krátká sezení úplně bez něj: ne jako trest, ale jako jediný způsob, jak zjistit, co doopravdy umíš.",
          },
        ],
        whenBehind: "Škrtají se nové funkce a čtení. Stavění a sezení bez asistenta zůstávají — na těch dvou to celé stojí.",
        goal: "Postavit vlastní aplikaci od nuly a rozumět každému řádku",
        questions: [
          {
            id: "stack",
            label: "V jakém jazyce a s čím stavíš?",
            hint: "třeba JavaScript, Next.js a Node.js — nebo Python, nebo klidně „nevím, co mi to AI nasadila“",
          },
          {
            id: "path",
            label: "Chceš stavět novou věc, nebo rozumět tomu, co už máš?",
            hint: "postavit novou od nuly / projít si to, co už mám / hlavně stavět a to staré brát jako srovnání",
          },
          {
            id: "build",
            label: "Co chceš postavit?",
            hint: "čím konkrétnější, tím líp — plán se staví kolem té jedné věci",
          },
          {
            id: "stuck",
            label: "Kde se nejčastěji zasekneš?",
            hint: "chyba, se kterou si asistent neví rady / nevím, proč to funguje / neumím to poskládat dohromady",
          },
        ],
      },
      en: {
        title: "From vibecoding to actually coding",
        pitch:
          "You can get something working out of an AI assistant — and you also suspect you could not put it together yourself from nothing. This walks you through building one application of your own, from the first file to a working base, under one rule: you write the code.",
        what: "Builds one application with you from zero: first something that runs, then one capability at a time, each one whole. Theory arrives when the thing you are building needs it, never earlier. The assistant explains and reviews; you write the code.",
        forWhom:
          "For anyone who has vibecoded something and does not want to stop there. Complete beginners included — most people start this way now. If you would rather understand what you already have than build something new, the plan does that too.",
        phases: [
          {
            when: "Something that runs, in the first few days",
            what: "Not three weeks of setup, tooling and tidying folders — that is exactly where plans like this die. The smallest thing that starts, shows something and is in version control. If you can get it somewhere public in week one, better still.",
          },
          {
            when: "One capability at a time, each one whole",
            what: "Show something. Take what the user types. Store it. Read it back. Show what happens when it fails. Each of those goes through the entire application, top to bottom — not a week on the database and then a week on the interface, because nothing works until the end and nothing is learned on the way.",
          },
          {
            when: "Theory only once it is good for something",
            what: "Storing data is the moment you learn how data is shaped and where the truth lives. Taking input is the moment for validation and for why you never trust it. Never more than a week ahead of what you need it for.",
          },
          {
            when: "You write the code, the assistant explains",
            what: "This is the whole difference between learning and more vibecoding. The assistant answers, explains and reviews what you wrote — but does not produce the code that goes into your project. Tell it so at the start of each session. Plus short sessions with none of it: not as punishment, but as the only way to find out what you actually know.",
          },
        ],
        whenBehind: "New features and reading get cut. The building and the sessions without the assistant stay — the whole thing rests on those two.",
        goal: "Build my own application from scratch and understand every line",
        questions: [
          {
            id: "stack",
            label: "What language and tools are you building with?",
            hint: "JavaScript with Next.js and Node.js, say — or Python, or honestly “no idea, the assistant picked it”",
          },
          {
            id: "path",
            label: "Do you want to build something new, or understand what you already have?",
            hint: "build a new one from scratch / go through what I already have / mostly build, and use the old one for comparison",
          },
          {
            id: "build",
            label: "What do you want to build?",
            hint: "the more specific the better — the plan is built around that one thing",
          },
          {
            id: "stuck",
            label: "Where do you get stuck most often?",
            hint: "a bug the assistant cannot solve / I don't know why it works / I can't hold it together",
          },
        ],
      },
      de: {
        title: "Vom Vibecoding zum echten Programmieren",
        pitch:
          "Du bekommst mit einem KI-Assistenten etwas Funktionierendes hin — und ahnst zugleich, dass du es von null allein nicht zusammenbrächtest. Das hier führt dich durch den Bau einer eigenen Anwendung, von der ersten Datei bis zu einer funktionierenden Grundlage, unter einer Regel: den Code schreibst du.",
        what: "Baut mit dir eine Anwendung von null: erst etwas, das läuft, dann eine Fähigkeit nach der anderen, jede ganz. Theorie kommt dann, wenn das, was du baust, sie braucht, nie früher. Der Assistent erklärt und prüft; den Code schreibst du.",
        forWhom:
          "Für alle, die schon etwas zusammenvibecodet haben und nicht dabei stehen bleiben wollen. Auch für Anfänger — heute fangen die meisten so an. Wer lieber das versteht, was er schon hat, bekommt dafür ebenfalls einen Plan.",
        phases: [
          {
            when: "Schon in den ersten Tagen etwas, das läuft",
            what: "Keine drei Wochen Einrichten, Konfigurieren und Ordnersortieren — genau daran sterben solche Pläne. Das Kleinste, was startet, etwas anzeigt und in der Versionsverwaltung liegt. Wenn du es in der ersten Woche auch nach draußen bekommst, umso besser.",
          },
          {
            when: "Eine Fähigkeit nach der anderen, und jede ganz",
            what: "Etwas anzeigen. Annehmen, was eingegeben wird. Speichern. Zurücklesen. Zeigen, was passiert, wenn es schiefgeht. Jede davon geht durch die ganze Anwendung, von oben bis unten — nicht eine Woche Datenbank und dann eine Woche Oberfläche, denn dabei funktioniert bis zum Schluss nichts und unterwegs lernt man nichts.",
          },
          {
            when: "Theorie erst, wenn sie zu etwas gut ist",
            what: "Daten zu speichern ist der Moment, in dem du lernst, wie Daten geformt sind und wo die Wahrheit liegt. Eingaben anzunehmen ist der Moment für Validierung und dafür, warum man Eingaben nie traut. Nie mehr als eine Woche vor dem, wofür du es brauchst.",
          },
          {
            when: "Den Code schreibst du, der Assistent erklärt",
            what: "Das ist der ganze Unterschied zwischen Lernen und weiterem Vibecoding. Der Assistent antwortet, erklärt und prüft, was du geschrieben hast — aber er erzeugt nicht den Code, der in dein Projekt geht. Sag ihm das zu Beginn jeder Sitzung. Dazu kurze Einheiten ganz ohne ihn: nicht als Strafe, sondern als einziger Weg herauszufinden, was du wirklich kannst.",
          },
        ],
        whenBehind: "Neue Funktionen und Lesestoff werden gestrichen. Das Bauen und die Einheiten ohne Assistenten bleiben — darauf steht das Ganze.",
        goal: "Eine eigene Anwendung von null bauen und jede Zeile verstehen",
        questions: [
          {
            id: "stack",
            label: "In welcher Sprache und womit baust du?",
            hint: "zum Beispiel JavaScript mit Next.js und Node.js — oder Python, oder ehrlich „keine Ahnung, das hat der Assistent ausgesucht“",
          },
          {
            id: "path",
            label: "Willst du etwas Neues bauen oder verstehen, was du schon hast?",
            hint: "etwas Neues von null bauen / durchgehen, was ich schon habe / hauptsächlich bauen und das Alte zum Vergleich nehmen",
          },
          {
            id: "build",
            label: "Was willst du bauen?",
            hint: "je konkreter, desto besser — der Plan wird um diese eine Sache herum gebaut",
          },
          {
            id: "stuck",
            label: "Wo bleibst du am häufigsten hängen?",
            hint: "ein Fehler, den der Assistent nicht löst / ich weiß nicht, warum es funktioniert / ich kriege es nicht zusammen",
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

Build the tasks around what they actually draw with. Charcoal, pencil
and a tablet each want different exercises, and a plan that ignores
this asks for things they cannot do tonight. The same goes for whether
they have anything to draw from life: without it, lean on photograph
reference and say so rather than assuming a still life on the table.

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
            id: "tools",
            label: "Čím kreslíš?",
            hint: "tužka, uhel, tablet — a jestli máš kde kreslit podle skutečnosti",
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
            id: "tools",
            label: "What do you draw with?",
            hint: "pencil, charcoal, tablet — and whether you have somewhere to draw from life",
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
            id: "tools",
            label: "Womit zeichnest du?",
            hint: "Bleistift, Kohle, Tablet — und ob du irgendwo nach der Natur zeichnen kannst",
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
