import type { GoalTemplate } from "./index";

/**
 * Podnikání.
 *
 * Nejsilnější oblast z celé knihovny — ukazuje lidem, že aplikace umí
 * pomoct s něčím, u čeho by je nenapadlo plánovač hledat.
 *
 * Pravidlo, podle kterého jsou vybrané: **skromnější zadání vyrábí
 * lepší plán.** „Rozjet vlastní firmu" se klikne víc, ale je to mlhavé
 * zadání a vznikne z něj mlhavý plán. „Získat prvních deset platících
 * zákazníků" zní menší a vyrobí plán, který mění, na čem člověk ten
 * den pracuje. Ambici mu vrací `pitch`, ne název.
 */

export const business: GoalTemplate[] = [
  {
    id: "first-ten-customers",
    area: "business",
    defaultMonths: 4,
    guidance: `
The goal is ten completed, paid transactions from people who are not
friends or family. Not sign-ups, not waiting-list emails, not "very
interested". Money that arrived.

Order that must not be rearranged:
1. Name one specific group of people and one problem they already pay to
   solve. Vague audiences ("small businesses") produce vague outreach and
   no sales.
2. Talk to people in that group before building or polishing anything.
   Aim for a number of conversations per week, tracked.
3. Ask for money early, on the smallest possible version of the offer.
   The first sale teaches more than a month of preparation.
4. Only then improve the product, guided by what buyers actually said.

The failure this plan exists to prevent: spending the whole period
building and none of it selling. Product work is comfortable and feels
productive; asking a stranger for money is not. Weight the plan
accordingly — most weeks should contain more conversations than building.

Make progress countable every week: conversations held, offers made,
sales closed. "Worked on the website" is not progress here.

Include the unglamorous mechanics as real tasks: how to take payment,
what to write in the first message, what to say when someone says the
price is too high.

When the person falls behind, cut product work first and protect the
conversations. That is the opposite of what they will want to do.
`.trim(),
    text: {
      cs: {
        title: "Získat prvních deset platících zákazníků",
        pitch:
          "Skoro každý začínající plánuje produkt. Zákazníky neplánuje nikdo — a přitom podnikání nevzniká s produktem, ale s prvními lidmi, kteří zaplatí.",
        what: "Rozpadne cestu k deseti zaplaceným objednávkám na týdenní počty rozhovorů, nabídek a uzavření — a pohlídá, aby se místo prodávání nedělal jen produkt.",
        forWhom:
          "Pro toho, kdo má co nabídnout, ale ještě mu za to nikdo nezaplatil. I když to není úplně hotové.",
        phases: [
          {
            when: "Nejdřív jedna skupina a jeden problém",
            what: "Pojmenovat konkrétní lidi a potíž, za jejíž řešení už dnes platí. „Malé firmy“ je mlhavé zadání a vede k mlhavému oslovování, na které nikdo neodpoví.",
          },
          {
            when: "Pak rozhovory, dřív než se cokoliv staví",
            what: "Daný počet hovorů týdně, počítaný. Většina týdnů má obsahovat víc mluvení než stavění — budování je příjemné a vypadá jako práce, jenže zákazníky nepřivede.",
          },
          {
            when: "Požádat o peníze brzy",
            what: "Na nejmenší možné verzi nabídky. První skutečný prodej naučí víc než měsíc příprav, protože teprve u něj se pozná, co lidé opravdu chtějí.",
          },
          {
            when: "Teprve nakonec vylepšovat",
            what: "Podle toho, co řekli kupující, ne podle toho, co se zdálo. V plánu jsou i ty neatraktivní věci: jak vzít platbu, co napsat do první zprávy, co odpovědět na „to je drahé“.",
          },
        ],
        whenBehind: "Škrtá se práce na produktu, rozhovory zůstávají. Je to přesně naopak, než na co má člověk chuť.",
        goal: "Získat prvních deset platících zákazníků",
        questions: [
          {
            id: "stage",
            label: "Co prodáváš a v jaké je to fázi?",
            hint: "nápad / rozdělané / hotové, ale bez zákazníků",
          },
          {
            id: "reach",
            label: "Kolik lidí o tom dnes ví?",
            hint: "nikdo / pár známých / mám nějaké publikum",
          },
          {
            id: "blocker",
            label: "Co tě u toho nejvíc brzdí?",
            hint: "nevím, komu to nabídnout / stydím se říct si o peníze / nemám to hotové",
          },
        ],
      },
      en: {
        title: "Win your first ten paying customers",
        pitch:
          "Almost everyone starting out plans the product. Nobody plans the customers — and yet a business does not begin with a product, it begins with the first people who pay.",
        what: "Breaks the path to ten paid orders into weekly counts of conversations, offers and closes — and keeps you from building instead of selling.",
        forWhom:
          "For anyone who has something to offer but nobody has paid for it yet. Even if it is not quite finished.",
        phases: [
          {
            when: "One group of people, one problem",
            what: "Name people specifically, and a problem they already pay to have solved. “Small businesses” is a vague brief and produces vague outreach that nobody answers.",
          },
          {
            when: "Then conversations, before anything gets built",
            what: "A set number of conversations a week, counted. Most weeks hold more talking than building — building is pleasant and looks like work, but it does not bring customers.",
          },
          {
            when: "Ask for money early",
            what: "On the smallest possible version of the offer. One real sale teaches more than a month of preparation, because that is where you find out what people actually want.",
          },
          {
            when: "Improve the product last",
            what: "Guided by what buyers said, not by what seemed likely. The unglamorous parts are tasks too: how to take payment, what the first message says, what to answer when someone says it is too expensive.",
          },
        ],
        whenBehind: "Product work gets cut and the conversations stay. That is the exact opposite of what you will feel like doing.",
        goal: "Win my first ten paying customers",
        questions: [
          {
            id: "stage",
            label: "What are you selling, and what stage is it at?",
            hint: "an idea / half-built / finished but no customers",
          },
          {
            id: "reach",
            label: "How many people know about it today?",
            hint: "nobody / a few friends / I have some audience",
          },
          {
            id: "blocker",
            label: "What holds you back most?",
            hint: "I don't know who to offer it to / asking for money embarrasses me / it isn't ready",
          },
        ],
      },
      de: {
        title: "Die ersten zehn zahlenden Kunden gewinnen",
        pitch:
          "Fast jeder am Anfang plant das Produkt. Die Kunden plant niemand — dabei beginnt ein Geschäft nicht mit einem Produkt, sondern mit den ersten Menschen, die zahlen.",
        what: "Zerlegt den Weg zu zehn bezahlten Aufträgen in wöchentliche Zahlen: Gespräche, Angebote, Abschlüsse — und verhindert, dass du baust statt verkaufst.",
        forWhom:
          "Für alle, die etwas anzubieten haben, für das noch niemand bezahlt hat. Auch wenn es noch nicht ganz fertig ist.",
        phases: [
          {
            when: "Eine Gruppe, ein Problem",
            what: "Konkrete Menschen benennen und ein Problem, für dessen Lösung sie heute schon zahlen. „Kleine Unternehmen“ ist eine vage Vorgabe und führt zu vager Ansprache, auf die niemand antwortet.",
          },
          {
            when: "Dann Gespräche, bevor irgendetwas gebaut wird",
            what: "Eine feste Zahl Gespräche pro Woche, gezählt. In den meisten Wochen wird mehr geredet als gebaut — Bauen ist angenehm und sieht nach Arbeit aus, bringt aber keine Kunden.",
          },
          {
            when: "Früh nach Geld fragen",
            what: "Bei der kleinstmöglichen Version des Angebots. Ein echter Verkauf lehrt mehr als ein Monat Vorbereitung, denn erst dort zeigt sich, was die Leute wirklich wollen.",
          },
          {
            when: "Das Produkt zuletzt verbessern",
            what: "Nach dem, was Käufer gesagt haben, nicht nach dem, was plausibel schien. Auch das Unglamouröse sind Aufgaben: wie man Zahlungen annimmt, was in der ersten Nachricht steht, was man auf „das ist zu teuer“ antwortet.",
          },
        ],
        whenBehind: "Die Produktarbeit wird gestrichen, die Gespräche bleiben. Das ist genau das Gegenteil von dem, wonach dir sein wird.",
        goal: "Meine ersten zehn zahlenden Kunden gewinnen",
        questions: [
          {
            id: "stage",
            label: "Was verkaufst du, und in welchem Stadium ist es?",
            hint: "eine Idee / halb fertig / fertig, aber ohne Kunden",
          },
          {
            id: "reach",
            label: "Wie viele Menschen wissen heute davon?",
            hint: "niemand / ein paar Bekannte / ich habe etwas Publikum",
          },
          {
            id: "blocker",
            label: "Was hält dich am meisten auf?",
            hint: "ich weiß nicht, wem ich es anbieten soll / nach Geld zu fragen ist mir unangenehm / es ist nicht fertig",
          },
        ],
      },
    },
  },

  {
    id: "side-business",
    area: "business",
    defaultMonths: 6,
    guidance: `
Starting a business alongside a job. The constraint that shapes
everything: the person has a few hours a week, not full days, and those
hours are tired hours in the evening.

The real blocker is almost never motivation — it is not knowing the
order of the paperwork, so the whole thing stalls before it starts.
Front-load the administrative sequence and make each step a single small
task with a clear "done": trade licence or registration, tax
registration, health and social insurance notifications, a business bank
account, invoicing, and what records have to be kept from day one.

Say plainly that the exact steps and their order depend on the country,
and instruct the person to verify against their own authority — but
still give the sequence, because the sequence is what they are missing.
Do not invent specific fees, deadlines or form numbers.

After the admin, the plan turns to the first income. Do not let it become
a business-plan exercise: one offer, one group of people, first invoice.

Protect the day job. Plan around a realistic evening, assume some weeks
will be lost to it, and keep at least one genuinely free day a week —
someone who burns out at month two finishes nothing.

When the person falls behind, cut the polishing and the studying first.
Keep the administrative steps and the first offer.
`.trim(),
    text: {
      cs: {
        title: "Rozjet živnost vedle zaměstnání",
        pitch:
          "Nejčastější a nejvíc odkládaná věc. Lidé neuvíznou na nápadu ani na odvaze — uvíznou na papírování, protože neví, v jakém pořadí se co dělá.",
        what: "Seřadí úřední kroky do pořadí, ve kterém se dělají, a rozpadne je na večerní úkoly. Pak navede k první vystavené faktuře.",
        forWhom:
          "Pro toho, kdo má práci, kterou hned tak neopustí, a chce si vedle ní něco rozjet naostro.",
        phases: [
          {
            when: "Papíry v pořadí, ve kterém na sebe navazují",
            what: "Živnost, daně, zdravotní a sociální, účet, faktury, co se musí od prvního dne evidovat. Každý krok jako jeden malý úkol s jasným „hotovo“.",
          },
          {
            when: "Ověřit si to u svého úřadu",
            what: "Přesné kroky a lhůty se liší podle země, takže plán dává pořadí a posílá si je potvrdit. Chybějící pořadí je to, kvůli čemu se celá věc zasekne dřív, než začne.",
          },
          {
            when: "První nabídka, ne podnikatelský plán",
            what: "Jedna nabídka, jedna skupina lidí, první faktura. Ne analýza trhu a ne web, který se bude ladit do léta.",
          },
          {
            when: "Práce zůstává prací",
            what: "Plán počítá s večery po běžném dni a s tím, že některé týdny padnou. Alespoň jeden opravdu volný den v týdnu — kdo vyhoří ve druhém měsíci, nedokončí nic.",
          },
        ],
        whenBehind: "Škrtá se dolaďování a studium. Úřední kroky a první nabídka zůstávají.",
        goal: "Rozjet vlastní živnost vedle zaměstnání",
        questions: [
          {
            id: "what",
            label: "Co chceš dělat?",
            hint: "co budeš nabízet a komu",
          },
          {
            id: "hours",
            label: "Kolik hodin týdně na to reálně máš?",
            hint: "počítej večery a víkendy, ne ideál",
          },
          {
            id: "done",
            label: "Co už máš za sebou?",
            hint: "nic / mám nápad a zjišťuji / něco už běží načerno",
          },
        ],
      },
      en: {
        title: "Start a business alongside your job",
        pitch:
          "The most common and most postponed plan there is. People do not get stuck on the idea or the courage — they get stuck on the paperwork, because nobody tells them what order it goes in.",
        what: "Puts the administrative steps in the order they are actually done and breaks them into evening-sized tasks. Then takes you to the first invoice.",
        forWhom:
          "For anyone with a job they are not about to leave, who wants to start something real beside it.",
        phases: [
          {
            when: "The paperwork, in the order it depends on itself",
            what: "Registration, tax, health and social insurance, a bank account, invoicing, what has to be recorded from day one. Each step is one small task with a clear “done”.",
          },
          {
            when: "Check it against your own authority",
            what: "The exact steps and deadlines differ by country, so the plan gives you the sequence and sends you to confirm it. The missing sequence is what stalls the whole thing before it starts.",
          },
          {
            when: "A first offer, not a business plan",
            what: "One offer, one group of people, a first invoice. Not market analysis, and not a website that gets polished until summer.",
          },
          {
            when: "The job stays the job",
            what: "The plan assumes tired evenings and accepts that some weeks will be lost. At least one genuinely free day a week — someone who burns out in month two finishes nothing.",
          },
        ],
        whenBehind: "Polishing and studying get cut. The administrative steps and the first offer stay.",
        goal: "Start my own business alongside my job",
        questions: [
          {
            id: "what",
            label: "What do you want to do?",
            hint: "what you will offer and to whom",
          },
          {
            id: "hours",
            label: "How many hours a week do you realistically have?",
            hint: "count evenings and weekends, not the ideal",
          },
          {
            id: "done",
            label: "What have you done already?",
            hint: "nothing / I have an idea and I'm looking into it / I've done some work unofficially",
          },
        ],
      },
      de: {
        title: "Neben dem Job selbstständig werden",
        pitch:
          "Der häufigste und am meisten aufgeschobene Plan überhaupt. Die Leute scheitern nicht an der Idee oder am Mut — sie scheitern am Papierkram, weil ihnen niemand sagt, in welcher Reihenfolge er kommt.",
        what: "Bringt die Behördenschritte in die Reihenfolge, in der sie wirklich gemacht werden, und zerlegt sie in Aufgaben für einen Abend. Danach führt er zur ersten Rechnung.",
        forWhom:
          "Für alle mit einem Job, den sie so bald nicht aufgeben, und die daneben etwas Echtes aufbauen wollen.",
        phases: [
          {
            when: "Der Papierkram in der Reihenfolge, in der er aufeinander aufbaut",
            what: "Gewerbeanmeldung, Steuer, Kranken- und Sozialversicherung, Konto, Rechnungen, was vom ersten Tag an festgehalten werden muss. Jeder Schritt eine kleine Aufgabe mit klarem „erledigt“.",
          },
          {
            when: "Bei deiner eigenen Behörde prüfen",
            what: "Die genauen Schritte und Fristen unterscheiden sich je nach Land, deshalb gibt der Plan die Reihenfolge und schickt dich zum Bestätigen. Genau diese fehlende Reihenfolge lässt die Sache steckenbleiben, bevor sie anfängt.",
          },
          {
            when: "Ein erstes Angebot, kein Businessplan",
            what: "Ein Angebot, eine Gruppe von Menschen, eine erste Rechnung. Keine Marktanalyse und keine Website, an der bis zum Sommer gefeilt wird.",
          },
          {
            when: "Der Job bleibt der Job",
            what: "Der Plan rechnet mit müden Abenden und damit, dass manche Wochen ausfallen. Mindestens ein wirklich freier Tag pro Woche — wer im zweiten Monat ausbrennt, bringt gar nichts zu Ende.",
          },
        ],
        whenBehind: "Feinschliff und Lernen werden gestrichen. Die behördlichen Schritte und das erste Angebot bleiben.",
        goal: "Neben meinem Job selbstständig werden",
        questions: [
          {
            id: "what",
            label: "Was möchtest du machen?",
            hint: "was du anbieten willst und wem",
          },
          {
            id: "hours",
            label: "Wie viele Stunden pro Woche hast du realistisch?",
            hint: "rechne mit Abenden und Wochenenden, nicht mit dem Idealfall",
          },
          {
            id: "done",
            label: "Was hast du schon erledigt?",
            hint: "nichts / ich habe eine Idee und informiere mich / ich habe inoffiziell schon etwas gemacht",
          },
        ],
      },
    },
  },

  {
    id: "selling-skills",
    area: "business",
    defaultMonths: 3,
    guidance: `
Learning to sell your own work. This is a skill goal, not a knowledge
goal — reading about sales changes nothing. The plan must be built from
repeated small exposures that get slightly harder, the way a training
plan is.

Build three strands in parallel and keep them balanced week to week:
1. Practice alone — writing offers, rewriting a price list, recording
   yourself explaining what you do in thirty seconds, drafting the
   message you would send to a stranger.
2. Practice with people — telling an acquaintance what you do without
   apologising, asking one person for a referral, sending one cold
   message, then one call.
3. Study, deliberately small — one principle a week, applied
   immediately. Never more than a chapter without using it.

Pricing deserves its own thread: saying a number out loud without
flinching, raising a price with an existing client, handling "that's
expensive" without dropping to a discount.

The obstacle is almost never technique. It is the feeling that
self-promotion is shameful. Treat that directly: plan exposures small
enough that they can be done while uncomfortable, and never plan a leap
that the previous week has not prepared.

Make progress countable: offers sent, prices stated, conversations
started. Not "felt more confident".

When the person falls behind, cut the studying, never the exposures.
`.trim(),
    text: {
      cs: {
        title: "Naučit se prodávat to, co dělám",
        pitch:
          "Nejvíc peněz nechávají ležet lidé, kteří svou práci umí a nedokážou si o ni říct. Prodávání není talent — je to dovednost a trénuje se jako každá jiná.",
        what: "Postaví denní a týdenní cvičení ve třech proudech: nanečisto o samotě, naostro mezi lidmi a trocha teorie, kterou hned použiješ.",
        forWhom:
          "Pro toho, kdo svou práci dělá dobře a je mu nepříjemné za ni říct si o cenu.",
        phases: [
          {
            when: "Nácvik o samotě",
            what: "Napsat nabídku, přepsat ceník, nahrát se, jak třicet vteřin vysvětluješ, co děláš. Nanečisto, ale pořádně.",
          },
          {
            when: "Nácvik s lidmi, po malých krocích",
            what: "Říct známému, co děláš, bez omlouvání. Poprosit jednoho člověka o doporučení. Poslat jednu zprávu někomu cizímu. Pak zavolat.",
          },
          {
            when: "Ceny jako vlastní téma",
            what: "Vyslovit číslo bez zaváhání. Zvednout cenu stávajícímu klientovi. Unést „to je drahé“, aniž by z toho byla sleva.",
          },
          {
            when: "Studium po lžičkách",
            what: "Jeden princip týdně a hned použitý. Nikdy ne další kapitola, dokud ta předchozí nebyla v praxi.",
          },
        ],
        whenBehind: "Škrtá se studium, nikdy ne ty malé zkoušky s lidmi. Na nich celá věc stojí.",
        goal: "Naučit se prodávat to, co dělám, a říct si o svou cenu",
        questions: [
          {
            id: "work",
            label: "Co nabízíš?",
            hint: "krátce, jako cizímu člověku",
          },
          {
            id: "hardest",
            label: "Co je pro tebe nejtěžší?",
            hint: "oslovit cizího / říct cenu / ustát námitku / mluvit o sobě",
          },
          {
            id: "now",
            label: "Jak k tobě zákazníci chodí teď?",
            hint: "doporučení / sám oslovuji / nechodí",
          },
        ],
      },
      en: {
        title: "Learn to sell what you do",
        pitch:
          "The people leaving the most money on the table are the ones who are good at their work and cannot ask for it. Selling is not a talent — it is a skill, and it trains like any other.",
        what: "Builds daily and weekly exercises in three strands: rehearsal alone, real exposure with people, and just enough theory to use the same week.",
        forWhom:
          "For anyone who does good work and finds it uncomfortable to name their price.",
        phases: [
          {
            when: "Practice alone",
            what: "Write the offer. Rewrite the price list. Record yourself explaining in thirty seconds what you do. Not for real yet, but done properly.",
          },
          {
            when: "Practice with people, in small steps",
            what: "Tell an acquaintance what you do without apologising. Ask one person for a referral. Send one message to a stranger. Then make the call.",
          },
          {
            when: "Pricing as its own thread",
            what: "Say the number out loud without flinching. Raise a price with an existing client. Take “that is expensive” without it turning into a discount.",
          },
          {
            when: "Study by the spoonful",
            what: "One principle a week, used immediately. Never the next chapter until the last one has been out in the world.",
          },
        ],
        whenBehind: "Studying gets cut, never the small exposures with people. The whole thing rests on those.",
        goal: "Learn to sell what I do and ask for my price",
        questions: [
          {
            id: "work",
            label: "What do you offer?",
            hint: "briefly, as you would say it to a stranger",
          },
          {
            id: "hardest",
            label: "What is hardest for you?",
            hint: "approaching strangers / saying the price / handling objections / talking about myself",
          },
          {
            id: "now",
            label: "How do customers reach you today?",
            hint: "referrals / I reach out myself / they don't",
          },
        ],
      },
      de: {
        title: "Lernen, die eigene Arbeit zu verkaufen",
        pitch:
          "Am meisten Geld lassen die liegen, die ihre Arbeit beherrschen und nicht dafür einstehen können. Verkaufen ist kein Talent — es ist eine Fähigkeit und lässt sich trainieren wie jede andere.",
        what: "Baut tägliche und wöchentliche Übungen in drei Strängen: Probe allein, echte Begegnungen mit Menschen und gerade so viel Theorie, wie du in derselben Woche anwendest.",
        forWhom:
          "Für alle, die gute Arbeit machen und denen es unangenehm ist, ihren Preis zu nennen.",
        phases: [
          {
            when: "Allein üben",
            what: "Das Angebot schreiben. Die Preisliste neu schreiben. Dich aufnehmen, wie du in dreißig Sekunden erklärst, was du tust. Noch nicht im Ernstfall, aber richtig.",
          },
          {
            when: "Mit Menschen üben, in kleinen Schritten",
            what: "Einer bekannten Person sagen, was du tust, ohne dich zu entschuldigen. Eine Person um eine Empfehlung bitten. Eine Nachricht an jemanden Fremdes schicken. Dann anrufen.",
          },
          {
            when: "Preise als eigener Strang",
            what: "Die Zahl aussprechen, ohne zu zucken. Bei einem bestehenden Kunden den Preis erhöhen. „Das ist teuer“ aushalten, ohne dass ein Rabatt daraus wird.",
          },
          {
            when: "Lernen löffelweise",
            what: "Ein Prinzip pro Woche, sofort angewendet. Nie das nächste Kapitel, solange das letzte nicht draußen war.",
          },
        ],
        whenBehind: "Das Lernen wird gestrichen, nie die kleinen Versuche mit Menschen. Darauf steht die ganze Sache.",
        goal: "Lernen, meine Arbeit zu verkaufen und meinen Preis zu nennen",
        questions: [
          {
            id: "work",
            label: "Was bietest du an?",
            hint: "kurz, so wie du es einem Fremden sagen würdest",
          },
          {
            id: "hardest",
            label: "Was fällt dir am schwersten?",
            hint: "Fremde ansprechen / den Preis nennen / Einwände aushalten / über mich reden",
          },
          {
            id: "now",
            label: "Wie kommen Kunden heute zu dir?",
            hint: "Empfehlungen / ich spreche selbst an / sie kommen nicht",
          },
        ],
      },
    },
  },
];
