import type { PdfPlanTemplate } from "./index";

/**
 * Pohyb. Oproti zkouškám tu hrozí něco jiného než nestihnout: zranění
 * z přepálení, které celou přípravu ukončí v půlce.
 */
export const fitness: PdfPlanTemplate[] = [
  {
    id: "pulmaraton",
    area: "fitness",
    suggestedWeeks: 12,
    disclaimer: "health",
    guidance: `The goal is to run a half marathon (21.1 km) on a fixed race date.

This is a plan for a body, not a calendar, so the limit is not time but recovery:
1. Weekly distance goes up by at most ten per cent, and every fourth week goes down by about a third. The easy week is not a reward, it is when the adaptation actually happens — say that in the plan so nobody skips it.
2. Most of the running is slow. If the person can hold a conversation while running, the pace is right. Only one harder session a week, and never two days in a row.
3. The longest run reaches about 16–18 km, not the full distance. The last three kilometres on race day come from the crowd and the taper, and running 21 km in training buys nothing but fatigue.
4. The last two weeks are a taper: distance drops by roughly half while the harder session stays. People feel heavy and slow in this phase and think they have lost form — write that into the plan, because that is when they are most tempted to ruin it.

The mistake that sinks people: running the easy runs too fast. It feels like effort and produces injury instead of endurance.

How to measure progress: completing the planned long run at a conversational pace, not the time on the watch.

Do not include: daily running. Rest days are part of the training, and at least two a week.

What to cut when behind: drop the harder session and keep the long run. Endurance comes from the long run; speed only shaves off minutes.

If the starting point says the person does not run at all yet, the first weeks must alternate walking and running, and the plan must say honestly in its first week whether the race date is realistic.

Daily tasks should say the distance or the time and the pace, and include the rest days as items too — a rest day that is written down is kept.`,
    text: {
      cs: {
        title: "Příprava na půlmaraton",
        pitch:
          "Rozpis týden po týdnu, který hlídá, abys nepřepálil začátek a doběhl ve zdraví.",
        forWhom:
          "Pro toho, kdo má závod v kalendáři a neví, kolik a jak rychle má běhat.",
        outline: [
          "Objem roste nejvýš o desetinu týdně a každý čtvrtý týden se ubírá — v tom lehkém týdnu se tělo teprve přizpůsobí",
          "Většina běhů je pomalá. Když se u běhu dá povídat, je tempo správné",
          "Nejdelší trénink je šestnáct až osmnáct kilometrů, ne celá trať",
          "Poslední dva týdny se ubírá. Budeš se cítit těžce a myslet si, že jsi ztratil formu — to je v plánu napsané, protože právě tehdy se dá všechno pokazit",
        ],
        whenBehind:
          "Škrtá se rychlejší trénink. Dlouhý běh a dny volna zůstávají — vytrvalost roste z dlouhého běhu, rychlost ubere jen minuty. A nábíhání se nikdy nestlačuje, aby se dohnalo zameškané; tak končí příprava zraněním místo v cíli.",
        goal: "Uběhnout půlmaraton ",
      },
      en: {
        title: "Preparing for a half marathon",
        pitch:
          "A week-by-week plan that keeps you from overdoing the start and gets you to the finish uninjured.",
        forWhom:
          "For anyone with a race in the calendar who does not know how far or how fast to run.",
        outline: [
          "Weekly distance rises by at most a tenth, and every fourth week it drops — the easy week is when the body actually adapts",
          "Most runs are slow. If you can hold a conversation, the pace is right",
          "The longest run is 16 to 18 km, not the full distance",
          "The last two weeks wind down. You will feel heavy and think you have lost form — that is written into the plan, because that is exactly when people ruin it",
        ],
        whenBehind:
          "The faster session gets cut. The long run and the rest days stay — endurance comes from the long run, speed only shaves off minutes. And the build-up is never compressed to catch up; that is how preparation ends in injury instead of at the finish.",
        goal: "Run a half marathon on ",
      },
      de: {
        title: "Vorbereitung auf einen Halbmarathon",
        pitch:
          "Ein Plan Woche für Woche, der dich davon abhält, den Anfang zu überziehen, und dich gesund ins Ziel bringt.",
        forWhom:
          "Für alle mit einem Rennen im Kalender, die nicht wissen, wie weit und wie schnell sie laufen sollen.",
        outline: [
          "Der Umfang steigt höchstens um ein Zehntel pro Woche, und jede vierte Woche wird reduziert — in der leichten Woche passt sich der Körper erst an",
          "Die meisten Läufe sind langsam. Wenn du dich dabei unterhalten kannst, stimmt das Tempo",
          "Der längste Lauf geht über 16 bis 18 km, nicht über die ganze Distanz",
          "Die letzten zwei Wochen wird reduziert. Du wirst dich schwer fühlen und denken, du hättest die Form verloren — das steht im Plan, denn genau dann macht man alles kaputt",
        ],
        whenBehind:
          "Die schnellere Einheit fällt weg. Der lange Lauf und die Ruhetage bleiben — Ausdauer kommt vom langen Lauf, Tempo spart nur Minuten. Und der Aufbau wird nie gestaucht, um Versäumtes aufzuholen; so endet die Vorbereitung mit einer Verletzung statt im Ziel.",
        goal: "Einen Halbmarathon laufen am ",
      },
    },
  },
];
