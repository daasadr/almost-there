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
            hint: "nic / mám nápad a zjišťuji / už jsem něco udělal načerno",
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
        goal: "Naučit se prodávat to, co dělám, a říct si o svou cenu",
        questions: [
          {
            id: "work",
            label: "Co nabízíš?",
            hint: "krátce, jako bys to říkal cizímu člověku",
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
