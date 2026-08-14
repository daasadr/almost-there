import type { Locale } from "@/i18n/routing";

/**
 * Návod k používání.
 *
 * Dlouhé texty patří sem, ne mezi UI stringy v `messages/*.json` — stejně
 * jako obchodní podmínky. Navíc by se tím do prohlížeče posílal návod
 * s každou stránkou; takhle se vykreslí na serveru a klient ho nikdy
 * nedostane.
 *
 * Píše se pro tři čtenáře najednou:
 *
 *  - kdo aplikaci používá a něčemu nerozumí — proto jsou oddíly krátké
 *    a nadepsané otázkou, ne názvem funkce,
 *  - kdo si chce před registrací přečíst, jak to funguje, místo aby to
 *    zkoušel,
 *  - jazykový model, který web najde a má z něj umět odpovědět. Proto
 *    jsou čísla a lhůty napsané doslova, ne opsané („po třech dnech“,
 *    ne „po pár dnech“).
 *
 * Když se změní chování aplikace, musí se změnit i tenhle text. Čísla
 * v něm jsou tvrzení, ne ilustrace.
 */

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  /** Kroky, když má oddíl postup. Vykreslí se číslovaně. */
  steps?: string[];
};

export type GuideDocument = {
  intro: string;
  sections: GuideSection[];
};

export const guideByLocale: Record<Locale, GuideDocument> = {
  cs: {
    intro:
      "AlmostThere vezme tvůj cíl a termín a udělá z nich plán až na úroveň dnešního dne. Tenhle návod projde všechno, co aplikace umí, v pořadí, ve kterém to budeš potřebovat. Číst od začátku do konce nemusíš — každý oddíl stojí sám o sobě.",
    sections: [
      {
        heading: "Co aplikace vlastně dělá",
        paragraphs: [
          "Řekneš jí cíl a datum, do kdy ho chceš mít splněný. Ona z toho spočítá plán pozpátku: rozdělí cestu na fáze po měsících, každou fázi na týdny a nejbližší týdny na konkrétní denní úkoly. Ráno pak otevřeš aplikaci a vidíš seznam na dnešek.",
          "Rozdíl proti seznamu úkolů je v tom, že si ho nepíšeš sám. Aplikace ví, kolik času do termínu zbývá a kolik ho máš denně, a podle toho rozdělí práci. Když začneš zaostávat, ozve se a nabídne řešení.",
        ],
      },
      {
        heading: "Než založíš první cíl: nastavení",
        paragraphs: [
          "Tři hodnoty v nastavení určují, jak bude plán vypadat, a platí pro všechny tvoje cíle dohromady. Vyplať se je projít dřív, než něco založíš — plán se podle nich staví a měnit je zpětně znamená přeplánovat.",
          "Kolik času denně máš na cíle dohromady. Ne kolik bys chtěl, ale kolik reálně zvládneš i ve špatném týdnu. Nadsazené číslo je nejčastější důvod, proč plány padají.",
          "Jak často chceš mít volno. Na výběr je žádné volno, jeden nebo dva dny v týdnu, nebo obden. Dny volna jsou položkou plánu, ne mezerou v něm.",
          "Kolik minut denně na ohlédnutí. Krátká chvíle na zápis, co šlo a co ne. Dá se vypnout nulou.",
          "K tomu časové pásmo — podle něj aplikace pozná, kdy ti začíná nový den.",
        ],
      },
      {
        heading: "Jak založit cíl",
        paragraphs: [
          "Na cíli záleží víc než na čemkoliv jiném. Čím konkrétnější je zadání, tím použitelnější je plán.",
        ],
        steps: [
          "Napiš cíl jednou větou. „Uběhnout půlmaraton“ je lepší než „začít sportovat“, protože z prvního jde poznat, kdy je hotovo.",
          "Zvol termín. Aplikace ti po rozfázování řekne, jestli je reálný — a když není, napíše proč.",
          "Do popisu doplň, co má aplikace vědět: proč to děláš, co tě omezuje, na čem ti záleží.",
          "Do políčka „co už máš“ napiš, odkud začínáš. Bez toho plán vypadá stejně pro začátečníka i pro toho, kdo má půlku za sebou.",
          "Vyber barvu. V denním seznamu podle ní na první pohled poznáš, ke kterému cíli úkol patří.",
          "Klikni na Rozfázovat cíl. Trvá to půl minuty až minutu; stránku nechej otevřenou.",
        ],
      },
      {
        heading: "Co z toho vznikne",
        paragraphs: [
          "Nejdřív uvidíš, jak aplikace tvůj cíl pochopila, a posouzení, jestli je termín reálný. Přečti si to — je to jediná chvíle, kdy se dá nedorozumění chytit dřív, než se podle něj naplánuje půl roku.",
          "Pod tím jsou fáze: úseky po měsících s popisem, co má být na konci každého z nich hotové. Podrobnosti se dopisují postupně — na nejbližší období do týdnů a dnů, vzdálenější zůstávají v hrubých fázích, dokud na ně nedojde. Šetří to čas i náklady a hlavně to nechává prostor pro to, že se cesta cestou změní.",
        ],
      },
      {
        heading: "Každodenní používání",
        paragraphs: [
          "Hlavní obrazovka ukazuje dnešek: úkoly ze všech běžících cílů, každý ve své barvě, s odhadem, kolik zabere. Odškrtáváš je, jak je plníš.",
          "Nad seznamem je týdenní pruh se zkratkami dnů. Odškrtnuté dny mají háček, dnešek je zvýrazněný. Klikáním se dá projít celý týden dozadu i dopředu — hodí se, když si chceš doplnit včerejšek nebo se podívat, co tě čeká zítra.",
          "Pod tím je pruh posledních třiceti dnů. Není to hodnocení, jen obrázek toho, jak ti to jde ve skutečnosti.",
        ],
      },
      {
        heading: "Co dělat, když úkol dnes nejde splnit",
        paragraphs: [
          "Někdy úkol splnit nejde z důvodů, o kterých plán nemůže vědět — nemáš zrovna peníze, čekáš na někoho jiného, prší. U každého úkolu je proto tlačítko „Dnes nemůžu“.",
          "Nabídne přesunout úkol na zítřek, na konkrétní datum, nebo ho odložit stranou bez data. Úkol se nevyměňuje ani nenahrazuje jiným — je to pořád tentýž úkol, jen v jiný den. Můžeš připsat, proč to nešlo; použije se to, až se bude plán přepočítávat.",
          "Neodškrtávej, co jsi neudělal. Aplikace podle odškrtaných dní počítá tempo a podle tempa ti radí — jedno falešné zaškrtnutí a začne ti tvrdit, že stíháš.",
          "Když ti po odložení na dnešek nic jiného nezbude, aplikace nabídne úkoly z nejbližších dnů, které si můžeš vzít místo toho. Plán se tím nenafoukne, jen se posune dopředu.",
          "Úkoly odložené bez data mají vlastní seznam pod denním plánem. Nic nepřipomínají, ale nezmizí — kdykoliv jim můžeš dát datum.",
        ],
      },
      {
        heading: "Když začneš zaostávat",
        paragraphs: [
          "Vynechaný den se nic neděje. Když se ale za poslední dva týdny nasbírají tři dny, kdy jsi neudělal nic, aplikace se ozve a nabídne dvě cesty.",
          "Dohnat skluz znamená nechat termín být a přeplánovat zbytek tak, aby se to stihlo. Přepočítat termín znamená posunout datum na takové, které odpovídá tempu, jaké máš doopravdy.",
          "Vybíráš vždycky ty. Aplikace ti termín sama neposune a nabídku po odmítnutí týden nezopakuje.",
          "Nedodělky z posledních sedmi dnů se ukazují nad dnešním seznamem. Můžeš je dodatečně odškrtnout, odložit na jindy, nebo je nechat být — někdy je to správná odpověď.",
        ],
      },
      {
        heading: "Milníky a odměny",
        paragraphs: [
          "Každá fáze plánu končí milníkem — místem, kde je co ukázat. Ke každému si můžeš přidat odměnu, kterou si dáš, až tam dojdeš.",
          "Odměnu buď napíšeš sám, nebo ji necháš navrhnout. Aby návrh za něco stál, vyplň si v nastavení, co ti udělá radost a co naopak ne. Bez toho vychází průměr, který nesedí skoro nikomu.",
          "Dlouhý cíl nedává měsíce žádnou zpětnou vazbu. Milník je to, co ho drží při životě.",
        ],
      },
      {
        heading: "Víc cílů najednou",
        paragraphs: [
          "Souběžně můžeš mít až pět cílů. Plánují se dohromady, takže se ti nesejdou na stejné dny a nepřekročí čas, který jsi na ně vyhradil.",
          "U každého cíle nastavuješ důležitost. Podle ní se rozděluje denní kapacita — důležitější cíl dostane víc času.",
          "Cíl jde kdykoliv pozastavit; přestane se objevovat v denním plánu a nebere si kapacitu. Až budeš chtít, rozběhneš ho zpátky.",
          "Ke každému cíli si můžeš nahrát obrázky, které ti připomínají, proč to děláš. Jeden z nich se ukáže u denního seznamu; čím víc jich nahraješ, tím větší je pestrost.",
        ],
      },
      {
        heading: "Kolik toho můžeš použít",
        paragraphs: [
          "Pět souběžných cílů a deset nových plánů měsíčně. Nový plán se počítá při založení cíle nebo při přeplánování celého cíle.",
          "Všechno ostatní se do limitu nepočítá a je bez omezení: rozfázování na týdny a dny, denní úkoly, návrhy odměn. Kdo si cíl založí a pracuje na něm, nevyčerpá za měsíc ani polovinu.",
          "Nad tím je ještě měsíční strop spotřeby AI. Vidíš ho v aplikaci v procentech. Je nastavený tak, aby ho běžné používání nedosáhlo — chytá překlepy a útoky, ne zákazníky.",
        ],
      },
      {
        heading: "Aplikace v telefonu",
        paragraphs: [
          "Web funguje v mobilním prohlížeči a dá se přidat na plochu, odkud se otevírá na celou obrazovku bez adresního řádku. Návod krok za krokem pro iPhone i Android je na stránce o instalaci.",
          "V aplikaci stažené z obchodu si můžeš zapnout denní připomínku: telefon se ozve ve zvolený čas, i když aplikaci nemáš otevřenou. Plánuje se přímo v telefonu, takže o ní na server nic neodchází a funguje i bez signálu.",
          "Ať otevřeš aplikaci odkudkoliv, přihlašuješ se stejným účtem a máš v ní ty samé cíle.",
        ],
      },
      {
        heading: "Účet, platba a odchod",
        paragraphs: [
          "Účet a předplatné se zakládá na webu. Platí se měsíčně nebo ročně, ročně vychází dva měsíce zdarma.",
          "Předplatné zrušíš v aplikaci jedním tlačítkem. Doběhne do konce zaplaceného období — zaplacený čas se neukrajuje — a pak se samo neobnoví. Do té doby jde zrušení vzít zpátky.",
          "Účet můžeš smazat v nastavení. Není to deaktivace: cíle, plány, úkoly i nahrané obrázky se opravdu smažou. Podrobnosti o tom, co zůstává a proč, jsou na samostatné stránce o rušení účtu.",
        ],
      },
      {
        heading: "Co se děje s tím, co do aplikace napíšeš",
        paragraphs: [
          "Názvy a popisy cílů i úkolů jsou v databázi uložené zašifrované. Text cíle se posílá jazykovému modelu, který z něj plán sestaví — jinam neodchází, k reklamě se nepoužívá a nikdo ho nečte kvůli zvědavosti.",
          "Obrázky se při nahrání překódují, čímž se z nich odstraní metadata včetně údajů o poloze. Zobrazují se jen tobě po přihlášení.",
          "Podrobně je to popsané v zásadách ochrany osobních údajů.",
        ],
      },
    ],
  },

  en: {
    intro:
      "AlmostThere takes your goal and your deadline and turns them into a plan that reaches all the way down to today. This guide covers everything the app does, in the order you will need it. You do not have to read it start to finish — each section stands on its own.",
    sections: [
      {
        heading: "What the app actually does",
        paragraphs: [
          "You give it a goal and the date by which you want it done. It works backwards: it divides the way there into monthly phases, each phase into weeks, and the nearest weeks into concrete daily tasks. In the morning you open the app and see a list for today.",
          "The difference from a to-do list is that you do not write it yourself. The app knows how much time is left until the deadline and how much you have each day, and divides the work accordingly. When you start falling behind, it speaks up and offers a way out.",
        ],
      },
      {
        heading: "Before your first goal: settings",
        paragraphs: [
          "Three values in settings shape every plan, and they apply to all your goals together. It is worth going through them before you create anything — plans are built on them, and changing them later means replanning.",
          "How much time you have for goals each day. Not how much you would like, but how much you manage even in a bad week. An inflated number is the most common reason plans collapse.",
          "How often you want a day off. Choose none, one or two days a week, or every other day. Rest days are items in the plan, not gaps in it.",
          "How many minutes a day for reflection. A short moment to note what worked and what did not. Zero turns it off.",
          "Plus your time zone, so the app knows when your day starts.",
        ],
      },
      {
        heading: "How to create a goal",
        paragraphs: [
          "The goal matters more than anything else. The more specific it is, the more usable the plan.",
        ],
        steps: [
          "Write the goal in one sentence. “Run a half marathon” beats “get fit”, because the first one tells you when you are done.",
          "Choose a deadline. After the breakdown the app tells you whether it is realistic — and if it is not, why.",
          "In the description add what the app should know: why you are doing it, what limits you, what matters to you.",
          "In the “what you already have” field write where you are starting from. Without it, the plan looks the same for a beginner and for someone half way there.",
          "Pick a colour. In the daily list it tells you at a glance which goal a task belongs to.",
          "Click Break the goal down. It takes half a minute to a minute; leave the page open.",
        ],
      },
      {
        heading: "What you get",
        paragraphs: [
          "First you see how the app understood your goal, and an assessment of whether the deadline is realistic. Read it — this is the only moment when a misunderstanding can be caught before half a year gets planned around it.",
          "Below that are the phases: month-long stretches with a description of what should be done by the end of each. Detail is filled in gradually — the nearest period down to weeks and days, the more distant ones staying as rough phases until their turn comes. It saves time and cost, and above all it leaves room for the road to change along the way.",
        ],
      },
      {
        heading: "Everyday use",
        paragraphs: [
          "The main screen shows today: tasks from all running goals, each in its colour, with an estimate of how long it takes. You tick them off as you go.",
          "Above the list is a week strip with day abbreviations. Ticked days carry a check mark, today is highlighted. You can click through the whole week backwards and forwards — useful when you want to fill in yesterday or see what tomorrow holds.",
          "Below that is a strip of the last thirty days. It is not a grade, just a picture of how it is actually going.",
        ],
      },
      {
        heading: "What to do when a task cannot be done today",
        paragraphs: [
          "Sometimes a task cannot be done for reasons the plan cannot know about — you do not have the money right now, you are waiting for someone else, it is raining. That is why every task has a “Not today” button.",
          "It offers to move the task to tomorrow, to a specific date, or to set it aside without a date. The task is not swapped or replaced by another one — it is the same task on a different day. You can add why it did not work; that gets used when the plan is recalculated.",
          "Do not tick off what you did not do. The app calculates your pace from the days you tick and advises you from that pace — one false tick and it starts telling you that you are on track.",
          "If postponing leaves nothing else for today, the app offers tasks from the coming days that you can take instead. The plan does not grow, it just moves forward.",
          "Tasks set aside without a date have their own list below the daily plan. They do not nag, but they do not disappear either — you can give them a date at any time.",
        ],
      },
      {
        heading: "When you fall behind",
        paragraphs: [
          "A missed day is nothing. But when three days in the last two weeks pass with nothing done, the app speaks up and offers two ways forward.",
          "Catching up means leaving the deadline alone and replanning the rest so it still fits. Recalculating the deadline means moving the date to one that matches the pace you actually keep.",
          "You always choose. The app never moves your deadline on its own, and if you decline, it does not ask again for a week.",
          "Unfinished tasks from the last seven days appear above today's list. You can tick them off late, postpone them, or let them go — sometimes that is the right answer.",
        ],
      },
      {
        heading: "Milestones and rewards",
        paragraphs: [
          "Every phase of the plan ends with a milestone — a point where there is something to show. To each one you can attach a reward you give yourself for getting there.",
          "Write the reward yourself, or have one suggested. For a suggestion to be worth anything, fill in what you enjoy and what does nothing for you in settings. Without that you get the average, which suits almost nobody.",
          "A long goal gives no feedback for months. The milestone is what keeps it alive.",
        ],
      },
      {
        heading: "Several goals at once",
        paragraphs: [
          "You can run up to five goals side by side. They are planned together, so they do not land on the same days and do not exceed the time you set aside.",
          "For each goal you set its importance. Daily capacity is divided accordingly — a more important goal gets more time.",
          "A goal can be paused at any time; it stops appearing in the daily plan and stops claiming capacity. You start it again whenever you want.",
          "To each goal you can upload images that remind you why you are doing it. One of them appears with your daily list; the more you add, the more variety you get.",
        ],
      },
      {
        heading: "How much you can use",
        paragraphs: [
          "Five concurrent goals and ten new plans a month. A new plan counts when you create a goal or replan an entire goal.",
          "Everything else is unlimited and does not count: breaking phases into weeks and days, the daily tasks, reward suggestions. Someone who creates a goal and works on it will not use half of the allowance in a month.",
          "Above that there is a monthly cap on AI spending, shown in the app as a percentage. It is set so that ordinary use never reaches it — it catches mistakes and abuse, not customers.",
        ],
      },
      {
        heading: "The app on your phone",
        paragraphs: [
          "The site works in a mobile browser and can be added to your home screen, from where it opens full screen without an address bar. Step-by-step instructions for iPhone and Android are on the install page.",
          "In the app from the store you can turn on a daily reminder: your phone speaks up at a time you choose, even when the app is closed. It is scheduled on the phone itself, so nothing about it leaves for our server and it works without a signal.",
          "Wherever you open the app from, you sign in with the same account and find the same goals.",
        ],
      },
      {
        heading: "Account, payment and leaving",
        paragraphs: [
          "Accounts and subscriptions are set up on the website. You pay monthly or yearly; yearly works out as two months free.",
          "You cancel the subscription in the app with one button. It runs to the end of the period you have paid for — paid time is never cut short — and then does not renew. Until then you can undo the cancellation.",
          "You can delete the account in settings. It is not a deactivation: goals, plans, tasks and uploaded images are really deleted. What remains and why is described on a separate page about deleting your account.",
        ],
      },
      {
        heading: "What happens to what you write here",
        paragraphs: [
          "The titles and descriptions of your goals and tasks are stored encrypted. The text of your goal is sent to a language model that builds the plan from it — it goes nowhere else, is never used for advertising, and nobody reads it out of curiosity.",
          "Images are re-encoded on upload, which strips their metadata including location data. They are shown only to you, after signing in.",
          "The full detail is in the privacy policy.",
        ],
      },
    ],
  },

  de: {
    intro:
      "AlmostThere nimmt dein Ziel und deinen Termin und macht daraus einen Plan, der bis zum heutigen Tag hinunterreicht. Diese Anleitung geht alles durch, was die App kann, in der Reihenfolge, in der du es brauchen wirst. Du musst sie nicht von vorne bis hinten lesen — jeder Abschnitt steht für sich.",
    sections: [
      {
        heading: "Was die App eigentlich macht",
        paragraphs: [
          "Du nennst ihr ein Ziel und das Datum, bis zu dem es geschafft sein soll. Sie rechnet rückwärts: Sie teilt den Weg in Monatsphasen, jede Phase in Wochen und die nächsten Wochen in konkrete Tagesaufgaben. Morgens öffnest du die App und siehst eine Liste für heute.",
          "Der Unterschied zu einer To-do-Liste: Du schreibst sie nicht selbst. Die App weiß, wie viel Zeit bis zum Termin bleibt und wie viel du täglich hast, und teilt die Arbeit danach auf. Wenn du in Rückstand gerätst, meldet sie sich und bietet einen Weg an.",
        ],
      },
      {
        heading: "Vor dem ersten Ziel: Einstellungen",
        paragraphs: [
          "Drei Werte in den Einstellungen prägen jeden Plan und gelten für alle deine Ziele zusammen. Es lohnt sich, sie durchzugehen, bevor du etwas anlegst — Pläne bauen darauf auf, und sie später zu ändern bedeutet umzuplanen.",
          "Wie viel Zeit du täglich für Ziele hast. Nicht wie viel du gern hättest, sondern wie viel du auch in einer schlechten Woche schaffst. Eine zu hohe Zahl ist der häufigste Grund, warum Pläne zusammenbrechen.",
          "Wie oft du frei haben willst. Zur Wahl stehen kein freier Tag, ein oder zwei Tage pro Woche oder jeder zweite Tag. Freie Tage sind Teil des Plans, keine Lücken darin.",
          "Wie viele Minuten täglich zum Innehalten. Ein kurzer Moment, um festzuhalten, was lief und was nicht. Null schaltet es ab.",
          "Dazu die Zeitzone, damit die App weiß, wann dein Tag beginnt.",
        ],
      },
      {
        heading: "So legst du ein Ziel an",
        paragraphs: [
          "Am Ziel liegt mehr als an allem anderen. Je konkreter es ist, desto brauchbarer der Plan.",
        ],
        steps: [
          "Schreib das Ziel in einem Satz. „Einen Halbmarathon laufen“ ist besser als „mit Sport anfangen“, weil man beim ersten erkennt, wann es geschafft ist.",
          "Wähle einen Termin. Nach der Aufteilung sagt dir die App, ob er realistisch ist — und wenn nicht, warum.",
          "Schreib in die Beschreibung, was die App wissen soll: warum du es tust, was dich einschränkt, worauf es dir ankommt.",
          "Ins Feld „was du schon hast“ schreib, wo du startest. Ohne das sieht der Plan für Anfänger und für Fortgeschrittene gleich aus.",
          "Wähle eine Farbe. In der Tagesliste erkennst du daran sofort, zu welchem Ziel eine Aufgabe gehört.",
          "Klick auf Ziel aufteilen. Es dauert eine halbe bis eine Minute; lass die Seite offen.",
        ],
      },
      {
        heading: "Was dabei herauskommt",
        paragraphs: [
          "Zuerst siehst du, wie die App dein Ziel verstanden hat, und eine Einschätzung, ob der Termin realistisch ist. Lies das — es ist der einzige Moment, in dem sich ein Missverständnis abfangen lässt, bevor darauf ein halbes Jahr geplant wird.",
          "Darunter stehen die Phasen: Abschnitte über Monate mit einer Beschreibung, was am Ende jeder Phase fertig sein soll. Die Details entstehen nach und nach — der nächste Zeitraum bis auf Wochen und Tage, die ferneren bleiben grobe Phasen, bis sie an der Reihe sind. Das spart Zeit und Kosten und lässt vor allem Raum dafür, dass sich der Weg unterwegs ändert.",
        ],
      },
      {
        heading: "Der tägliche Gebrauch",
        paragraphs: [
          "Der Hauptbildschirm zeigt heute: Aufgaben aus allen laufenden Zielen, jede in ihrer Farbe, mit einer Schätzung, wie lange sie dauert. Du hakst sie ab, während du sie erledigst.",
          "Über der Liste steht eine Wochenleiste mit Tageskürzeln. Abgehakte Tage tragen ein Häkchen, heute ist hervorgehoben. Du kannst die ganze Woche vor- und zurückklicken — praktisch, wenn du gestern nachtragen oder sehen willst, was morgen ansteht.",
          "Darunter liegt eine Leiste der letzten dreißig Tage. Das ist keine Note, nur ein Bild davon, wie es tatsächlich läuft.",
        ],
      },
      {
        heading: "Wenn eine Aufgabe heute nicht geht",
        paragraphs: [
          "Manchmal geht eine Aufgabe aus Gründen nicht, von denen der Plan nichts wissen kann — du hast gerade kein Geld, du wartest auf jemanden, es regnet. Deshalb hat jede Aufgabe einen Knopf „Heute nicht“.",
          "Er bietet an, die Aufgabe auf morgen zu schieben, auf ein bestimmtes Datum, oder sie ohne Datum zurückzustellen. Die Aufgabe wird weder getauscht noch ersetzt — es ist dieselbe Aufgabe an einem anderen Tag. Du kannst dazuschreiben, warum es nicht ging; das fließt ein, wenn der Plan neu gerechnet wird.",
          "Hak nichts ab, was du nicht getan hast. Die App berechnet dein Tempo aus den abgehakten Tagen und rät dir danach — ein falsches Häkchen, und sie behauptet, du liegst gut.",
          "Wenn nach dem Verschieben für heute nichts anderes bleibt, bietet die App Aufgaben aus den nächsten Tagen an, die du stattdessen nehmen kannst. Der Plan wächst dadurch nicht, er rückt nur vor.",
          "Ohne Datum zurückgestellte Aufgaben haben eine eigene Liste unter dem Tagesplan. Sie mahnen nicht, verschwinden aber auch nicht — du kannst ihnen jederzeit ein Datum geben.",
        ],
      },
      {
        heading: "Wenn du in Rückstand gerätst",
        paragraphs: [
          "Ein ausgelassener Tag ist nichts. Wenn aber in den letzten zwei Wochen drei Tage zusammenkommen, an denen nichts geschah, meldet sich die App und bietet zwei Wege an.",
          "Aufholen heißt: Termin lassen und den Rest so umplanen, dass es noch passt. Termin neu berechnen heißt: das Datum auf eines schieben, das zu deinem tatsächlichen Tempo passt.",
          "Du entscheidest immer. Die App verschiebt deinen Termin nie von selbst, und wenn du ablehnst, fragt sie eine Woche lang nicht wieder.",
          "Unerledigtes aus den letzten sieben Tagen erscheint über der heutigen Liste. Du kannst es nachträglich abhaken, verschieben oder ziehen lassen — manchmal ist das die richtige Antwort.",
        ],
      },
      {
        heading: "Meilensteine und Belohnungen",
        paragraphs: [
          "Jede Phase des Plans endet mit einem Meilenstein — einem Punkt, an dem es etwas zu zeigen gibt. Zu jedem kannst du eine Belohnung hinterlegen, die du dir gibst, wenn du dort ankommst.",
          "Schreib die Belohnung selbst oder lass dir eine vorschlagen. Damit ein Vorschlag etwas taugt, trag in den Einstellungen ein, was dir Freude macht und was dir nichts sagt. Ohne das kommt der Durchschnitt heraus, der fast niemandem passt.",
          "Ein langes Ziel gibt monatelang keine Rückmeldung. Der Meilenstein hält es am Leben.",
        ],
      },
      {
        heading: "Mehrere Ziele gleichzeitig",
        paragraphs: [
          "Du kannst bis zu fünf Ziele nebeneinander verfolgen. Sie werden gemeinsam geplant, damit sie nicht auf dieselben Tage fallen und die Zeit nicht überschreiten, die du dafür vorgesehen hast.",
          "Für jedes Ziel legst du seine Wichtigkeit fest. Danach wird die Tageskapazität verteilt — ein wichtigeres Ziel bekommt mehr Zeit.",
          "Ein Ziel lässt sich jederzeit pausieren; es erscheint dann nicht mehr im Tagesplan und beansprucht keine Kapazität. Du startest es wieder, wann du willst.",
          "Zu jedem Ziel kannst du Bilder hochladen, die dich daran erinnern, warum du es tust. Eines davon erscheint bei deiner Tagesliste; je mehr du hinzufügst, desto mehr Abwechslung.",
        ],
      },
      {
        heading: "Wie viel du nutzen kannst",
        paragraphs: [
          "Fünf gleichzeitige Ziele und zehn neue Pläne pro Monat. Ein neuer Plan zählt beim Anlegen eines Ziels oder beim Umplanen eines ganzen Ziels.",
          "Alles andere zählt nicht dagegen und ist unbegrenzt: die Aufteilung in Wochen und Tage, die Tagesaufgaben, die Belohnungsvorschläge. Wer ein Ziel anlegt und daran arbeitet, verbraucht im Monat nicht einmal die Hälfte.",
          "Darüber liegt noch eine monatliche Obergrenze für die KI-Kosten, in der App als Prozentwert sichtbar. Sie ist so gesetzt, dass normale Nutzung sie nie erreicht — sie fängt Fehler und Missbrauch ab, nicht Kunden.",
        ],
      },
      {
        heading: "Die App auf dem Handy",
        paragraphs: [
          "Die Website funktioniert im mobilen Browser und lässt sich zum Startbildschirm hinzufügen, von wo sie im Vollbild ohne Adressleiste startet. Eine Schritt-für-Schritt-Anleitung für iPhone und Android steht auf der Installationsseite.",
          "In der App aus dem Store kannst du eine tägliche Erinnerung einschalten: Das Telefon meldet sich zur gewählten Zeit, auch wenn die App geschlossen ist. Sie wird direkt auf dem Telefon geplant, also geht nichts davon an unseren Server, und sie funktioniert auch ohne Empfang.",
          "Egal von wo aus du die App öffnest — du meldest dich mit demselben Konto an und findest dieselben Ziele.",
        ],
      },
      {
        heading: "Konto, Zahlung und Abschied",
        paragraphs: [
          "Konto und Abo werden auf der Website eingerichtet. Bezahlt wird monatlich oder jährlich; jährlich ergibt zwei Monate geschenkt.",
          "Das Abo kündigst du in der App mit einem Knopf. Es läuft bis zum Ende des bezahlten Zeitraums — bezahlte Zeit wird nie gekürzt — und verlängert sich dann nicht. Bis dahin kannst du die Kündigung zurücknehmen.",
          "Das Konto kannst du in den Einstellungen löschen. Das ist keine Deaktivierung: Ziele, Pläne, Aufgaben und hochgeladene Bilder werden wirklich gelöscht. Was bleibt und warum, steht auf einer eigenen Seite zum Löschen des Kontos.",
        ],
      },
      {
        heading: "Was mit dem passiert, was du hier schreibst",
        paragraphs: [
          "Titel und Beschreibungen deiner Ziele und Aufgaben werden verschlüsselt gespeichert. Der Text deines Ziels geht an ein Sprachmodell, das daraus den Plan baut — sonst nirgendwohin, nie für Werbung, und niemand liest ihn aus Neugier.",
          "Bilder werden beim Hochladen neu kodiert, wodurch ihre Metadaten samt Standortangaben verschwinden. Sie werden nur dir nach der Anmeldung gezeigt.",
          "Ausführlich steht das in den Datenschutzhinweisen.",
        ],
      },
    ],
  },
};
