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
 * ── Tvar ──────────────────────────────────────────────────────────────
 *
 * První odstavec je oslovení, poslední je rozloučení. Upoutávka do
 * oznámení se bere z prvního skutečného odstavce — viz `teaser()`.
 *
 * ── Čeština mluví k oběma ─────────────────────────────────────────────
 *
 * Minulý čas je v češtině rodově určený, takže „všiml sis“ a „žil jsem“
 * mluví k muži a polovina čtenářů se v tom nenajde. Texty se proto píšou
 * tak, aby se rodu vyhnuly: přítomným časem („napadlo tě někdy“),
 * podstatnými jmény („po dnech plných řešení“) nebo infinitivem („jde
 * o to rozhodnout“). Oslovení je bezrodé — „ty na cestě“, ne „příteli“.
 *
 * Němčina tenhle problém nemá, angličtina taky ne. Hlídat se musí jen
 * čeština, a je to snadné přehlédnout, protože mužský rod zní „normálně“.
 *
 * ── Tón ───────────────────────────────────────────────────────────────
 *
 * Konkrétně a vlídně, tykání. Text nemá nic chtít: nemá vybízet
 * k otevření aplikace ani připomínat, co se nestihlo. Když někoho ráno
 * potěší nebo mu něco došlo, splnil svůj účel.
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
  /** Tělo textu po odstavcích, včetně oslovení a rozloučení. */
  paragraphs: string[];
};

const cs: MotivationPiece[] = [
  {
    title: "Nudit se je předpoklad nápadů",
    paragraphs: [
      "Ahoj, ty na cestě za svými cíli,",
      "napadlo tě někdy, jak ty nejjasnější nápady skoro nikdy nepřicházejí, když jedeš na sto procent? Když máš každou minutu naplánovanou, každou hodinu naplněnou snahou a mysl se řítí z jednoho úkolu na druhý, ty skutečné průlomy zůstávají zticha. Čekají na něco měkčího.",
      "Je tu tichá pravda, kterou mnoho z nás, co makáme, časem objeví: mysl potřebuje prostor, aby mohla bloumat. Ne to prázdné lenošení, které přichází, když člověk nikdy pořádně nezkusí. Ten prostor, který si dokáže vytvořit právě jen cílevědomý a pracovitý člověk. Po dnech plných řešení, tvoření, pomáhání a tlačení dopředu záměrně ustoupíš — a právě tehdy se stane kouzlo.",
      "Věda to potichu potvrzuje. Studie ukazují, že po soustředěné práci přináší období jemné nudy nebo bloumání mysli (výzkumníci tomu říkají inkubace) často originálnější nápady. Defaultní síť mozku — ten tichý systém na pozadí, který se rozsvítí, když se násilně nesoustředíme — začne vytvářet nečekaná spojení. Chůze je zvlášť silná. Známá stanfordská studie zjistila, že lidé při chůzi vymysleli asi o šedesát procent víc kreativních nápadů než vsedě. Tělo se jemně pohybuje, mysl může volně bloudit, a najednou se objeví řešení nebo nový pohled, jako by přišly odjinud. Někdy tomu říkáme vnuknutí. Ve skutečnosti je to tvůj pracovitý mozek, který konečně dostal prostor dořešit, co začal pod tlakem.",
      "U čistého lenocha to nefunguje. Mysl, která se nikdy nezapojí, nemá co propojovat. Funguje to tomu, kdo už byl v aréně — kdo naplnil den skutečnou snahou — a pak si chrání okénko měkkosti. Tu půlhodinovou procházku bez podcastů. To tiché kafe bez telefonu. To záměrné rozhodnutí být na chvíli buddhou tohoto parku.",
      "Pomáhá i vyměnit si na chvíli pomyslně identitu a odložit s ní své starosti. Představ si třeba, že máš teď na světě jediný úkol: být kotvou klidu, radosti a blažené přítomnosti. Jen sedět a ten prostor držet, jako by z tebe vycházel. Je to překvapivě uklidňující role. Nebo si vymysli vlastní, která ti sedne líp.",
      "Neztrácíš čas. Dáváš mozku jiný režim práce — ten, který samotným úsilím nikdy nevynutíš. Zároveň dáváš nervové soustavě oddech. Méně neustálé vysoké stimulace pomáhá obnovit zdravější rovnováhu mezi motivací a klidem, a ta tichá regenerace podporuje i tvou celkovou odolnost, včetně imunitního systému.",
      "Tak se dnes podívej na svůj plán s laskavostí. Někde v něm si záměrně nech malé okno pro bloumání. Ne jako odměnu, až bude všechno hotové, ale jako podstatnou součást samotné práce. Nech mysl volně bloudit. Nech ji chvíli se nudit. Věř, že kdo se plně zapojí a pak moudře odpočívá, bude dál dostávat nápady, které samotný spěch nikdy nepřinese.",
      "Makat už umíš. Dnes cvič umění nechávat prostor. Další krásné vnuknutí už čeká právě v tom tichu.",
      "Držím ti palce.",
    ],
  },
  {
    title: "Velké kameny patří do nádoby první",
    paragraphs: [
      "Ahoj, ty na cestě k tomu, co je důležité,",
      "představ si na chvíli, že tvůj den je skleněná nádoba. Ne nekonečný oceán času, ale nádoba s jasnými, pevnými stěnami. Všechno, co dnes chceš stihnout — hluboké rozhovory, soustředěná práce na tvém cíli, pohyb, který drží tělo silné, tichý okamžik se sebou, malé pochůzky, zprávy, náhlá vyrušení — se musí vejít právě do ní.",
      "Teď si představ velké kameny. To jsou ty dvě tři věci, které tě skutečně posunou dál. Ty, po kterých budeš večer cítit: „Ano. Tohle byl den podle toho, na čem záleží.“ Nemusí být nejhlasitější ani nejnaléhavější. Jsou to ty důležité. Rozhovor, který pořád odkládáš. Soustředěný blok na projektu, ze kterého roste tvoje budoucnost. Procházka nebo trénink, který tě ukotví. Tiché plánování, které drží cestu jasnou.",
      "Když nejdřív nasypeš písek — všechny ty drobné úkoly, nekonečné malé žádosti, reaktivní maily, drobná vyrušení — nádoba se rychle naplní. Pak se snažíš vrazit tam velké kameny, a ony se nevejdou. Odložíš je, slíbíš si „zítra“ a jdeš spát s tou známou tichou nespokojeností.",
      "Ale když dáš velké kameny dovnitř jako první, stane se něco krásného. Mezi nimi zůstane prostor. Štěrk středních úkolů se kolem nich usadí. Písek maličkostí vyplní i ty nejmenší mezery. Vejde se dokonce i trocha vody neočekávaného. Všechno se vejde — protože na začátku stálo to, na čem opravdu záleží.",
      "Nejde o to dělat velké kameny nutně hned ráno, i když to někdy pomáhá. Jde o to rozhodnout ještě před začátkem dne, že mají pevné místo. Podívat se na svůj plán a zeptat se: „Kde jsou dnes moje velké kameny? Sedí už pevně v nádobě?“",
      "Nejsi stroj, který musí zpracovat každé zrnko písku, které se objeví. Jsi člověk s omezenou, vzácnou nádobou hodin. A smíš si vybrat, co do ní přijde jako první.",
      "Tak se dnes ráno, ještě než svět začne sypat svůj písek, zastav. Pojmenuj své dva nebo tři velké kameny. Vlož je jemně, ale pevně do dne. A pak nech zbytek, ať se kolem nich uspořádá.",
      "Spoustu maličkostí pořád zvládneš. Ale zvládneš je z místa jasnosti, ne ze zmatku. A večer budeš vědět: to důležité nezůstalo venku mimo nádobu.",
      "To je svoboda. To je tichá síla. Tak se ze dne stane nejen den obsazený, ale smysluplný.",
      "Vstup do něj jemně a silně. Tvé velké kameny už čekají na své místo.",
    ],
  },
  {
    title: "Zaneprázdněnost není pohyb vpřed",
    paragraphs: [
      "Ahoj, ty na cestě k tomu, na čem opravdu záleží,",
      "je tichý rozdíl mezi tím být zaneprázdněný a tím se skutečně posouvat. Zaneprázdněnost naplňuje hodiny. Cílené jednání naplňuje nádobu těmi správnými kameny.",
      "Když dny působí nabité, a přesto v nich chybí skutečný pokrok, bývá to tím, že se ty činnosti nikdy záměrně nevybraly. Svoboda se neobjevuje náhodou. Vzniká tehdy, když dopředu rozhodneš, co si zaslouží místo v tvých omezených hodinách. Když naplánuješ věci, které tě opravdu posouvají k životu, jaký chceš, a pak je ochráníš, přestane tě unášet proud cizích naléhavostí.",
      "Tak se dnes podívej na svůj plán jasnýma očima. Polož si otázku: co je ta jedna konkrétní věc, která se počítá do směru, na kterém mi záleží? Ne mlhavý záměr. Ne další příprava na přípravu. Jeden skutečný krok. Ten první udělej dnes. Zítra druhý. Pozítří třetí. Malé pravidelné kroky se sčítají v něco, čeho náhlé výbuchy úsilí skoro nikdy nedosáhnou.",
      "A ještě něco, co většině z nás dojde až později: o každé cestě platí věci, které zůstanou neviditelné, dokud po ní člověk opravdu nejde. Můžeš se připravovat donekonečna, prostudovat každý detail, promyslet všechny možnosti — a stejně ti unikne, jaké to doopravdy je. Skutečné porozumění, potřebné úpravy, tichá jistota i nečekané příležitosti přicházejí teprve tehdy, když už jsi v pohybu.",
      "Příliš dlouhé rozmýšlení a odhodlávání se ke skoku se umí proměnit ve vlastní způsob odkládání. V určitou chvíli je to nejlaskavější, co pro sebe můžeš udělat, skočit — i nedokonale — a učit se z dopadu.",
      "Nepotřebuješ dokonalý plán. Potřebuješ jasný směr a ochotu udělat další viditelný krok. Když to děláš každý den, začne tě učit sama cesta. Nabíráš setrvačnost. Jistota se usazuje. A svoboda, která ti podle tebe chyběla, se začíná objevovat — protože je z plánu a z jednání, ne z náhody.",
      "Tak si dnes ráno vyber jednu věc, která se opravdu počítá. Vlož ji pevně do dne. A pak začni. Zbytek se ukáže cestou.",
      "Jsem s tebou.",
    ],
  },
  {
    title: "Oslavuj častěji, ne až na konci",
    paragraphs: [
      "Ahoj, ty na téhle cestě,",
      "je jedna tichá dovednost, na kterou ctižádostiví lidé zapomínají: umění se zastavit a oslavit.",
      "Ne ten hlasitý druh, co potřebuje alkohol a velkou párty. Ten čistý. Skutečné uznání, že je kus práce hotový. Chvíle, kdy se nad výsledkem zastavíš, doopravdy ho procítíš a dovolíš si hrdost dřív, než se vrhneš do dalšího úkolu. Může to být hluboký nádech, tiché „dobrá práce“, malá odměna, kterou si opravdu užiješ, nebo sdílení s někým, kdo tomu rozumí. Důležité je to nepřeskakovat.",
      "Kdo se naučí oslavu odkládat, bude ji odkládat pořád. Funguje to úplně stejně jako odkládání samotné práce. Čím dýl čekáš na „dostatečně velký“ okamžik, tím víc se malá vítězství ztrácejí v pozadí nekonečného usilování. A bez těch chvil uznání je cesta těžší, než musí být.",
      "Oslava není odbočka od cíle. Je součástí práce — a má skutečný vliv na to, jak funguje motivace. Pokaždé, když si upřímně všimneš kusu pokroku a označíš ho, zaregistruje mozek malý pozitivní signál. Dopamin, který pohání chuť pokračovat, na takové chvíle reaguje. Časté a poctivé uznání malých vítězství vytváří klidnější a zdravější rytmus než čekání na vzácné velké vrcholy, po kterých často přijde útlum. Učí to tvůj systém jediné větě: tohle úsilí mělo smysl, dělej to zas.",
      "Tak se dnes ohlédni za tím, co už máš za sebou. Nejen za obřími milníky. Za hotovým úkolem. Za upřímným rozhovorem. Za tréninkem, který málem nebyl. Za rozhodnutím, které konečně padlo. Zastav se u toho. Nech si na chvíli dojít, že pod nohama máš pevnou zem. A pak si klidně dej malou laskavou odměnu — ne jako úplatek, ale jako uznání, které drží motivaci v kondici.",
      "Čím víc to budeš cvičit, tím spíš budeš chtít dojít na další místo, kde bude co slavit. Z oslavy se stane palivo i cíl zároveň. Připomíná totiž, že práce není jen o tom někdy dorazit — je taky o tom být po cestě naživu.",
      "Máš za sebou víc, než si někdy dovolíš vidět. Dnes se zastav dost dlouho na to, aby ti to došlo. Oslav to. A pak pokračuj, lehčeji a silněji.",
      "Mám z tebe radost.",
    ],
  },
];

const en: MotivationPiece[] = [
  {
    title: "Boredom is where ideas come from",
    paragraphs: [
      "Hello, you on the way to your goals,",
      "have you ever noticed how the brightest ideas rarely show up when you are going at full speed? When every minute is scheduled, every hour filled with effort, and your mind is racing from one task to the next, the real breakthroughs stay quiet. They wait for something softer.",
      "There is a quiet truth many of us who work hard eventually discover: the mind needs room to wander. Not the empty idleness that comes from never really trying. The kind of room only a busy, purposeful person can create. After days full of solving, making, helping and pushing forward, you deliberately step back — and that is when the magic happens.",
      "Science quietly agrees. Studies show that after focused work, a period of gentle boredom or mind-wandering (researchers call it incubation) often leads to more original ideas. The brain's default mode network — the quiet background system that lights up when we are not forcing attention — starts making unexpected connections. Walking is especially powerful. A well-known Stanford study found that people came up with about sixty percent more creative ideas while walking than while sitting. The body moves gently, the mind is free to drift, and suddenly a solution or a new perspective appears as if from nowhere. We sometimes call it an insight. In reality it is your hardworking brain finally getting the room to finish what it started under pressure.",
      "This does not work for pure laziness. A mind that never engages has little to connect. It works for the one who has already been in the arena — who has filled the day with real effort — and then protects a window of softness. That half-hour walk without podcasts. That quiet coffee without the phone. That deliberate decision to be the Buddha of this park for a while.",
      "It also helps to swap identities for a moment and set your worries down with the old one. Imagine, for instance, that your only job in the world right now is to be an anchor of calm, joy and blissful presence. Just to sit and hold that space, as though it were coming out of you. It is a surprisingly soothing role. Or invent your own, one that fits you better.",
      "You are not wasting time. You are giving your brain a different mode of work — one that effort alone can never force. You are also giving your nervous system a break. Less constant high stimulation helps restore a healthier balance between drive and calm, and that quiet recovery supports your overall resilience, including your immune system.",
      "So today, look at your plan with kindness. Somewhere in it, leave a small, deliberate opening for wandering. Not as a reward once everything is done, but as a vital part of the work itself. Let your mind roam. Let it be a little bored. Trust that whoever shows up fully and then rests wisely will keep receiving the ideas that hurry alone never brings.",
      "You already know how to work hard. Today, practise the art of leaving space. The next beautiful insight is already waiting in that quiet.",
      "I am cheering for you.",
    ],
  },
  {
    title: "The big rocks go in first",
    paragraphs: [
      "Hello, you on the way to what matters,",
      "imagine for a moment that your day is a glass jar. Not an endless ocean of time, but a jar with clear, firm walls. Everything you want to do today — the deep conversations, the focused work on your goal, the movement that keeps your body strong, the quiet moment with yourself, the small errands, the messages, the sudden interruptions — has to fit inside it.",
      "Now picture the big rocks. These are the two or three things that truly move you forward. The ones that will have you feeling, at the end of the day: “Yes. This was a day lived by what matters.” They are not always the loudest or the most urgent. They are the important ones. The conversation you keep putting off. The focused block on the project your future grows from. The walk or the training that keeps you grounded. The quiet planning that keeps your path clear.",
      "If you pour in the sand first — all the tiny tasks, the endless small requests, the reactive emails, the little distractions — the jar fills quickly. Then you try to force the big rocks in, and they do not fit. You set them aside, promise yourself “tomorrow”, and go to bed with that familiar quiet disappointment.",
      "But when the big rocks go in first, something lovely happens. There is still space between them. The gravel of medium tasks settles around them. The sand of small things fills even the narrowest gaps. Even a little water of the unexpected still fits. Everything fits — because what truly counts was there at the start.",
      "This is not about doing the big rocks first thing in the morning, though that sometimes helps. It is about deciding, before the day begins, that they have a firm place. About looking at your plan and asking: “Where are my big rocks today? Are they already sitting solidly in the jar?”",
      "You are not a machine that has to process every grain of sand that appears. You are a person with a limited, precious jar of hours. And you get to choose what goes in first.",
      "So this morning, before the world starts pouring its sand, pause. Name your two or three big rocks. Place them gently but firmly into the day. Then let the rest arrange itself around them.",
      "You will still handle plenty of small things. But you will handle them from clarity rather than from scramble. And in the evening you will know: the important things did not stay outside the jar.",
      "That is freedom. That is quiet power. That is how a day becomes not merely full, but meaningful.",
      "Go into it gently and strongly. Your big rocks are already waiting for their place.",
    ],
  },
  {
    title: "Being busy is not moving forward",
    paragraphs: [
      "Hello, you on the way to what truly matters,",
      "there is a quiet difference between being busy and moving forward. Busyness fills the hours. Deliberate action fills the jar with the right stones.",
      "When your days feel packed and yet real progress is missing, it is usually because those activities were never deliberately chosen. Freedom does not appear by accident. It comes from deciding in advance what deserves room in your limited hours. When you plan the things that genuinely move you toward the life you want and then protect them, the current of other people\u2019s urgencies stops carrying you along.",
      "So today, look at your plan with clear eyes. Ask yourself: what is the one concrete thing that counts toward the direction I care about? Not a vague intention. Not more preparing to prepare. One real step. Take the first one today. The second tomorrow. The third the day after. Small, regular steps add up to something sudden bursts of effort almost never reach.",
      "And one more thing most of us learn late: every path holds truths that stay invisible until you actually walk it. You can prepare forever, study every detail, think through every possibility — and still miss what it is really like. The real understanding, the adjustments, the quiet confidence and the unexpected openings all arrive once you are already in motion.",
      "Thinking it over and working up to the leap can quietly turn into its own kind of delay. At some point the kindest thing you can do for yourself is to jump — imperfectly — and learn from the landing.",
      "You do not need a perfect plan. You need a clear direction and the willingness to take the next visible step. Do that every day and the path itself starts teaching you. Momentum builds. Confidence settles. And the freedom you thought you lacked begins to appear — because it came from planning and acting, not from chance.",
      "So this morning, choose one thing that really counts. Place it firmly in your day. Then begin. The rest will show itself as you go.",
      "I am with you on this.",
    ],
  },
  {
    title: "Celebrate more often, not only at the end",
    paragraphs: [
      "Hello, you on this journey,",
      "there is a quiet skill ambitious people forget: the art of stopping to celebrate.",
      "Not the loud kind that needs alcohol and a big party. The pure kind. The real recognition that a piece of work is done. The moment you stop with the result, feel it properly, and allow yourself some pride before rushing into the next task. It can be a deep breath, a quiet \u201cwell done\u201d, a small reward you truly enjoy, or sharing it with someone who understands. What matters is not skipping it.",
      "Anyone who learns to postpone celebration will keep postponing it. It works exactly like postponing the work itself. The longer you wait for the \u201cbig enough\u201d moment, the more small victories fade into the background of endless striving. And without those moments of recognition the path grows heavier than it needs to be.",
      "Celebrating is not a detour from the goal. It is part of the work — and it genuinely affects how motivation runs. Every time you honestly notice a piece of progress and mark it, your brain registers a small positive signal. Dopamine, which drives the appetite to keep going, responds to moments like these. Frequent, sincere recognition of small wins builds a calmer, healthier rhythm than waiting for rare big peaks, which are often followed by a slump. It teaches your system one sentence: this effort mattered, do it again.",
      "So today, look back at what you already have behind you. Not only the huge milestones. The finished task. The honest conversation. The training that almost did not happen. The decision that finally got made. Stop with it. Let it sink in for a moment that there is solid ground under your feet. And then, if you like, give yourself a small kind reward — not as a bribe, but as recognition that keeps motivation in good shape.",
      "The more you practise this, the more you will want to reach the next place where there is something to celebrate. Celebration becomes both the fuel and the destination. It reminds you that the work is not only about arriving one day — it is also about being alive along the way.",
      "You have more behind you than you sometimes let yourself see. Today, stop long enough for it to land. Celebrate it. Then carry on, lighter and stronger.",
      "You make me glad.",
    ],
  },
];

const de: MotivationPiece[] = [
  {
    title: "Langeweile ist die Bedingung für Ideen",
    paragraphs: [
      "Hallo, du auf dem Weg zu deinen Zielen,",
      "ist dir schon einmal aufgefallen, wie die hellsten Ideen selten kommen, wenn du auf voller Leistung fährst? Wenn jede Minute geplant ist, jede Stunde mit Anstrengung gefüllt und dein Geist von einer Aufgabe zur nächsten hetzt, dann bleiben die echten Durchbrüche still. Sie warten auf etwas Weicheres.",
      "Es gibt eine stille Wahrheit, die viele von uns, die hart arbeiten, irgendwann entdecken: Der Geist braucht Raum zum Schweifen. Nicht die leere Trägheit, die entsteht, wenn man es nie richtig versucht. Sondern den Raum, den sich nur ein zielstrebiger, fleißiger Mensch schaffen kann. Nach Tagen voller Lösen, Schaffen, Helfen und Vorantreiben trittst du bewusst zurück — und genau dann geschieht die Magie.",
      "Die Wissenschaft bestätigt das leise. Studien zeigen, dass nach konzentrierter Arbeit eine Phase sanfter Langeweile oder des Gedankenwanderns (Forscher nennen es Inkubation) oft zu originelleren Ideen führt. Das Default-Mode-Netzwerk des Gehirns — jenes stille Hintergrundsystem, das anspringt, wenn wir uns nicht gewaltsam konzentrieren — beginnt unerwartete Verbindungen zu knüpfen. Gehen ist besonders kraftvoll. Eine bekannte Stanford-Studie fand heraus, dass Menschen im Gehen etwa sechzig Prozent mehr kreative Ideen hervorbrachten als im Sitzen. Der Körper bewegt sich sanft, der Geist darf frei schweifen, und plötzlich erscheint eine Lösung oder eine neue Sicht, als käme sie von woanders. Manchmal nennen wir es Eingebung. In Wahrheit ist es dein fleißiges Gehirn, das endlich Raum bekommt, zu Ende zu rechnen, was es unter Druck begonnen hat.",
      "Bei reiner Faulheit funktioniert das nicht. Ein Geist, der sich nie einbringt, hat wenig zu verbinden. Es funktioniert bei dem, der schon in der Arena war — der den Tag mit echter Anstrengung gefüllt hat — und sich dann ein Fenster der Weichheit schützt. Den halbstündigen Spaziergang ohne Podcasts. Den stillen Kaffee ohne Handy. Die bewusste Entscheidung, für eine Weile der Buddha dieses Parks zu sein.",
      "Es hilft auch, die Identität für einen Moment zu tauschen und die eigenen Sorgen mit der alten abzulegen. Stell dir zum Beispiel vor, deine einzige Aufgabe auf der Welt sei gerade, ein Anker der Ruhe, der Freude und der seligen Gegenwart zu sein. Einfach zu sitzen und diesen Raum zu halten, als ginge er von dir aus. Es ist eine überraschend beruhigende Rolle. Oder erfinde dir eine eigene, die besser zu dir passt.",
      "Du verschwendest keine Zeit. Du gibst deinem Gehirn eine andere Arbeitsweise — eine, die reine Anstrengung nie erzwingen kann. Zugleich gönnst du deinem Nervensystem eine Pause. Weniger ständige hohe Stimulation hilft, ein gesünderes Gleichgewicht zwischen Antrieb und Ruhe wiederherzustellen, und diese stille Erholung stärkt auch deine allgemeine Widerstandskraft, einschließlich deines Immunsystems.",
      "Schau also heute mit Güte auf deinen Plan. Lass irgendwo bewusst ein kleines Fenster zum Schweifen. Nicht als Belohnung, wenn alles erledigt ist, sondern als wesentlichen Teil der Arbeit selbst. Lass deinen Geist wandern. Lass ihn ein wenig Langeweile haben. Vertrau darauf, dass jeder, der sich voll einbringt und dann klug ruht, weiterhin die Ideen bekommt, die bloße Eile nie bringt.",
      "Hart arbeiten kannst du schon. Übe heute die Kunst, Raum zu lassen. Die nächste schöne Eingebung wartet bereits in dieser Stille.",
      "Ich drücke dir die Daumen.",
    ],
  },
  {
    title: "Die großen Steine kommen zuerst",
    paragraphs: [
      "Hallo, du auf dem Weg zu dem, was zählt,",
      "stell dir einen Moment vor, dein Tag sei ein Glasgefäß. Kein endloser Ozean an Zeit, sondern ein Gefäß mit klaren, festen Wänden. Alles, was du heute tun möchtest — die tiefen Gespräche, die konzentrierte Arbeit an deinem Ziel, die Bewegung, die deinen Körper stark hält, der stille Moment mit dir selbst, die kleinen Erledigungen, die Nachrichten, die plötzlichen Unterbrechungen — muss genau da hinein passen.",
      "Stell dir nun die großen Steine vor. Das sind die zwei, drei Dinge, die dich wirklich voranbringen. Die, nach denen du am Abend spüren wirst: „Ja. Das war ein Tag nach dem, was zählt.“ Sie sind nicht immer die lautesten oder die dringendsten. Sie sind die wichtigen. Das Gespräch, das du immer wieder aufschiebst. Der konzentrierte Block an dem Projekt, aus dem deine Zukunft wächst. Der Spaziergang oder das Training, das dich erdet. Die stille Planung, die den Weg klar hält.",
      "Wenn du zuerst den Sand hineinschüttest — all die winzigen Aufgaben, die endlosen kleinen Anfragen, die reaktiven E-Mails, die kleinen Ablenkungen — füllt sich das Gefäß schnell. Dann versuchst du, die großen Steine hineinzuzwängen, und sie passen nicht. Du legst sie beiseite, versprichst dir „morgen“ und gehst mit dieser vertrauten stillen Enttäuschung schlafen.",
      "Aber wenn die großen Steine zuerst hineinkommen, geschieht etwas Schönes. Zwischen ihnen bleibt Raum. Der Kies der mittleren Aufgaben setzt sich um sie herum. Der Sand der Kleinigkeiten füllt selbst die schmalsten Lücken. Sogar ein wenig Wasser des Unerwarteten passt noch hinein. Alles passt — weil am Anfang das stand, worauf es wirklich ankommt.",
      "Es geht nicht darum, die großen Steine unbedingt als Erstes am Morgen zu erledigen, auch wenn das manchmal hilft. Es geht darum, vor dem Beginn des Tages zu entscheiden, dass sie einen festen Platz haben. Auf den eigenen Plan zu schauen und zu fragen: „Wo sind heute meine großen Steine? Sitzen sie schon fest im Gefäß?“",
      "Du bist keine Maschine, die jedes Sandkorn verarbeiten muss, das auftaucht. Du bist ein Mensch mit einem begrenzten, kostbaren Gefäß an Stunden. Und du darfst wählen, was zuerst hineinkommt.",
      "Halte also heute Morgen inne, bevor die Welt ihren Sand hineinschüttet. Benenne deine zwei oder drei großen Steine. Setze sie sanft, aber fest in den Tag. Und lass dann den Rest sich um sie herum ordnen.",
      "Viele Kleinigkeiten wirst du trotzdem erledigen. Aber du wirst sie aus Klarheit heraus erledigen, nicht aus dem Chaos. Und am Abend wirst du wissen: Das Wichtige ist nicht draußen vor dem Gefäß geblieben.",
      "Das ist Freiheit. Das ist stille Kraft. So wird aus einem Tag nicht nur ein voller, sondern ein bedeutungsvoller.",
      "Geh sanft und stark hinein. Deine großen Steine warten schon auf ihren Platz.",
    ],
  },
  {
    title: "Beschäftigt sein ist kein Vorankommen",
    paragraphs: [
      "Hallo, du auf dem Weg zu dem, worauf es wirklich ankommt,",
      "es gibt einen stillen Unterschied zwischen Beschäftigtsein und Vorankommen. Beschäftigtsein füllt die Stunden. Gezieltes Handeln füllt das Gefäß mit den richtigen Steinen.",
      "Wenn deine Tage voll wirken und echter Fortschritt trotzdem fehlt, liegt es meist daran, dass diese Tätigkeiten nie bewusst gewählt wurden. Freiheit entsteht nicht zufällig. Sie entsteht, wenn du im Voraus entscheidest, was Platz in deinen begrenzten Stunden verdient. Wenn du die Dinge planst, die dich wirklich zu dem Leben bringen, das du willst, und sie dann schützt, reißt dich der Strom fremder Dringlichkeiten nicht mehr mit.",
      "Schau also heute mit klaren Augen auf deinen Plan. Frag dich: Was ist die eine konkrete Sache, die in die Richtung zählt, die mir wichtig ist? Keine vage Absicht. Kein weiteres Vorbereiten des Vorbereitens. Ein echter Schritt. Den ersten heute. Morgen den zweiten. Übermorgen den dritten. Kleine, regelmäßige Schritte summieren sich zu etwas, das plötzliche Kraftakte fast nie erreichen.",
      "Und noch etwas, das die meisten von uns spät lernen: Über jeden Weg gilt etwas, das unsichtbar bleibt, bis man ihn wirklich geht. Du kannst dich ewig vorbereiten, jedes Detail studieren, jede Möglichkeit durchdenken — und dir entgeht trotzdem, wie es tatsächlich ist. Das echte Verstehen, die nötigen Anpassungen, die stille Sicherheit und die unerwarteten Gelegenheiten kommen erst, wenn du schon in Bewegung bist.",
      "Zu langes Nachdenken und Sich-Aufraffen wird leicht zur eigenen Form des Aufschiebens. Irgendwann ist das Gütigste, was du für dich tun kannst, zu springen — auch unvollkommen — und aus der Landung zu lernen.",
      "Du brauchst keinen perfekten Plan. Du brauchst eine klare Richtung und die Bereitschaft, den nächsten sichtbaren Schritt zu tun. Tu das jeden Tag, und der Weg selbst beginnt dich zu lehren. Du nimmst Schwung auf. Sicherheit setzt sich. Und die Freiheit, die dir angeblich fehlte, taucht auf — weil sie aus Plan und Handeln kommt, nicht aus Zufall.",
      "Wähle also heute Morgen eine Sache, die wirklich zählt. Setze sie fest in deinen Tag. Und dann fang an. Der Rest zeigt sich unterwegs.",
      "Ich bin bei dir.",
    ],
  },
  {
    title: "Feiere öfter, nicht erst am Ende",
    paragraphs: [
      "Hallo, du auf diesem Weg,",
      "es gibt eine stille Fähigkeit, die ehrgeizige Menschen vergessen: die Kunst, innezuhalten und zu feiern.",
      "Nicht die laute Art, die Alkohol und eine große Party braucht. Die reine. Die echte Anerkennung, dass ein Stück Arbeit fertig ist. Der Moment, in dem du beim Ergebnis innehältst, es richtig spürst und dir Stolz erlaubst, bevor du dich in die nächste Aufgabe stürzt. Es kann ein tiefer Atemzug sein, ein stilles \u201egut gemacht\u201c, eine kleine Belohnung, die du wirklich genießt, oder das Teilen mit jemandem, der es versteht. Wichtig ist, es nicht zu überspringen.",
      "Wer lernt, das Feiern aufzuschieben, wird es immer weiter aufschieben. Es funktioniert genau wie das Aufschieben der Arbeit selbst. Je länger du auf den \u201egroß genug\u201c Moment wartest, desto mehr verschwinden die kleinen Siege im Hintergrund des endlosen Strebens. Und ohne diese Momente der Anerkennung wird der Weg schwerer, als er sein müsste.",
      "Feiern ist kein Umweg vom Ziel. Es gehört zur Arbeit — und es wirkt tatsächlich darauf, wie Motivation läuft. Jedes Mal, wenn du ein Stück Fortschritt ehrlich bemerkst und markierst, registriert das Gehirn ein kleines positives Signal. Dopamin, das die Lust am Weitermachen antreibt, reagiert auf solche Momente. Häufige, aufrichtige Anerkennung kleiner Siege schafft einen ruhigeren, gesünderen Rhythmus als das Warten auf seltene große Höhepunkte, nach denen oft ein Durchhänger folgt. Es lehrt dein System einen einzigen Satz: Diese Anstrengung hatte Sinn, tu es wieder.",
      "Schau also heute zurück auf das, was du schon hinter dir hast. Nicht nur die riesigen Meilensteine. Die erledigte Aufgabe. Das ehrliche Gespräch. Das Training, das fast ausgefallen wäre. Die Entscheidung, die endlich gefallen ist. Halte dabei inne. Lass es einen Moment ankommen, dass fester Boden unter deinen Füßen ist. Und gönn dir dann ruhig eine kleine, gütige Belohnung — nicht als Bestechung, sondern als Anerkennung, die die Motivation in Form hält.",
      "Je mehr du das übst, desto eher willst du den nächsten Ort erreichen, an dem es etwas zu feiern gibt. Aus dem Feiern wird Treibstoff und Ziel zugleich. Es erinnert daran, dass es bei der Arbeit nicht nur ums Irgendwann-Ankommen geht — sondern auch darum, unterwegs lebendig zu sein.",
      "Du hast mehr hinter dir, als du dir manchmal zugestehst. Halte heute lange genug inne, damit es ankommt. Feiere es. Und dann geh weiter, leichter und stärker.",
      "Ich freue mich über dich.",
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
