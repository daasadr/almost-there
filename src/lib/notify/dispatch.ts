import "server-only";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getToday } from "@/lib/goals/queries";
import { parseIsoDate, todayIso } from "@/lib/plan/calendar";
import { motivationByLocale } from "@/content/motivation";
import {
  labelIndexForDay,
  pieceNumberForDay,
  teaser,
} from "@/lib/motivation";
import { pushConfigured, sendToUser } from "./push";
import type { Locale } from "@/i18n/routing";

/**
 * Kdo má právě teď dostat připomínku.
 *
 * Volá se zvenčí, opakovaně — každých pár minut. Aplikace sama žádný
 * časovač nemá a mít nemá: běží ve webovém serveru, který se restartuje
 * při každém nasazení, a časovač v něm by nasazení nepřežil. Spouštěč
 * je proto úloha v systému a tenhle modul jen odpoví na otázku „komu
 * teď?“.
 *
 * Čas se počítá v pásmu každého uživatele zvlášť. Sedmá hodina ráno je
 * pro každého jiný okamžik a posílat všem najednou podle serveru by
 * znamenalo budit půlku Evropy uprostřed noci.
 */

/**
 * Jak dlouho po nastaveném čase ještě má smysl posílat.
 *
 * Bylo to půl hodiny a bylo to křehké: rozesílání běží z úlohy v systému
 * a stačilo, aby se netrefila — nasazení, restart kontejneru, přetížený
 * stroj — a připomínka toho dne nevyšla vůbec. Nikdo se to nedozvěděl,
 * protože chybějící oznámení se nijak neprojeví.
 *
 * Čtyři hodiny jsou kompromis. Kdo si nastaví sedmou a všechno šlape,
 * dostane ji v sedm; když server v tu chvíli nestíhal, dorazí v devět
 * místo vůbec. Delší okno by z ranní myšlenky udělalo odpolední.
 *
 * Na doručení to nemá vliv: co odejde, poštovní služba prohlížeče podrží
 * a doručí, až se zařízení ozve. Tohle okno řeší jen to, jestli se
 * vůbec odešle.
 */
/**
 * Čára mezi myšlenkou a tím, co čeká v aplikaci.
 *
 * Ze znaků, protože v oznámení nic jiného nejde — tělo je čistý text
 * a systém v něm nevykreslí ani čáru, ani barvu. Barevné plochy máme
 * jen dvě, ikonu a velký obrázek, a ty jsou nad textem, ne v něm.
 *
 * Tenhle znak se vykreslí jako souvislá linka ve všech běžných písmech
 * a deset kusů nepřeteče ani na úzkém displeji.
 */
const SEPARATOR = "━━━━━━━━━━";

const WINDOW_MINUTES = 4 * 60;

/** Kdy se ptá večerní kontrola. */
const EVENING_HOUR = 20;

/** O kolik posune „připomeň později“. */
export const SNOOZE_HOURS = 2;

type Candidate = {
  id: string;
  locale: string;
  timezone: string;
  notifyTime: string;
  notifyEvening: boolean;
  notifyMode: "OFF" | "DAILY" | "WEEKLY";
  notifiedOn: string | null;
  notifiedEveningOn: string | null;
  notifySnoozedUntil: Date | null;
  /** Den registrace — podle něj se řadí myšlenky na den. */
  createdAt: Date;
};

/** Místní čas uživatele jako minuty od půlnoci a den v týdnu. */
function localNow(timezone: string): { minutes: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

function dueNow(user: Candidate, today: string): "morning" | "evening" | null {
  // Odložení mlčí na obojí. Kdo si řekl „později“, nechce mezitím nic.
  if (user.notifySnoozedUntil && user.notifySnoozedUntil > new Date()) {
    return null;
  }

  const { minutes, weekday } = localNow(user.timezone);

  // Týdenní režim mluví jen v pondělí.
  const weeklyOk = user.notifyMode !== "WEEKLY" || weekday === 1;

  const [hour, minute] = user.notifyTime.split(":").map(Number);
  const target = hour * 60 + minute;

  if (
    weeklyOk &&
    user.notifiedOn !== today &&
    minutes >= target &&
    minutes < target + WINDOW_MINUTES
  ) {
    return "morning";
  }

  /*
   * Večerní kontrola jen tehdy, když ráno něco odešlo.
   *
   * Ptát se „je to hotovo?“ někoho, komu jsme ráno nic neposlali — ať
   * proto, že si vybral týdenní režim, nebo že si připomínku odložil —
   * by bylo zvláštní a trochu vyčítavé.
   */
  if (
    user.notifyEvening &&
    user.notifiedOn === today &&
    user.notifiedEveningOn !== today &&
    minutes >= EVENING_HOUR * 60 &&
    minutes < EVENING_HOUR * 60 + WINDOW_MINUTES
  ) {
    return "evening";
  }

  return null;
}

function greetingKey(minutes: number): string {
  if (minutes < 11 * 60) return "morningGreetingMorning";
  if (minutes < 18 * 60) return "morningGreetingDay";
  return "morningGreetingEvening";
}

export type DispatchResult = {
  checked: number;
  sent: number;
  /** `false` znamená, že se neodesílalo vůbec — chybí klíče. */
  configured: boolean;
};

export async function dispatchReminders(): Promise<DispatchResult> {
  const users = await db.user.findMany({
    where: {
      notifyMode: { not: "OFF" },
      deletedAt: null,
      // Komu nic neposíláme, toho ani nenačítáme. Bez zařízení není kam.
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      locale: true,
      timezone: true,
      notifyTime: true,
      notifyEvening: true,
      notifyMode: true,
      notifiedOn: true,
      notifiedEveningOn: true,
      // Podle dne registrace se vybírá myšlenka na den.
      createdAt: true,
      notifySnoozedUntil: true,
    },
  });

  /*
   * Bez nastaveného podepisování nemá smysl procházet uživatele.
   *
   * Dřív se prošli všichni, každému se „poslalo" do prázdna a každému se
   * zapsalo, že dnes dostal svoje. Den byl tím spálený: po opravě
   * nastavení už mu ten den nic nepřišlo, protože značka tvrdila, že
   * přišlo. Takhle se neudělá nic a po opravě všechno doběhne.
   */
  if (!pushConfigured()) {
    return { checked: users.length, sent: 0, configured: false };
  }

  let sent = 0;

  for (const user of users as Candidate[]) {
    const today = todayIso(user.timezone);
    const kind = dueNow(user, today);
    if (!kind) continue;

    const locale = (["cs", "de"].includes(user.locale)
      ? user.locale
      : "en") as Locale;
    const t = await getTranslations({ locale, namespace: "plan.notify" });

    const plan = await getToday(user.id, user.timezone);
    const open = plan.tasks.filter((task) => task.status !== "DONE").length;

    /*
     * Večerní kontrola se ptá, jestli je hotovo. Bez otevřených úkolů
     * není na co se ptát — a „nemáš nic“ je přesně ten druh zprávy, po
     * které si lidé připomínky vypnou.
     *
     * Ráno je to jinak: tam nese oznámení myšlenku na den, a ta má smysl
     * i pro toho, kdo zrovna žádný cíl nemá. Právě on ji potřebuje
     * nejvíc.
     *
     * Značka se zapíše i při mlčení — aby se to za pět minut nezkoušelo
     * znovu.
     */
    if (kind === "evening" && open === 0) {
      await mark(user.id, kind, today);
      continue;
    }

    const { minutes, weekday } = localNow(user.timezone);

    const message =
      kind === "morning"
        ? await morningMessage({
            t,
            locale,
            userId: user.id,
            createdAt: user.createdAt,
            today,
            open,
            weekday,
            minutes,
          })
        : {
            title: t("eveningTitle"),
            body: t("eveningBody", { count: open }),
            tag: "almostthere-evening",
            url: `/${locale}/app`,
            actions: [
              { action: "open", title: t("actionOk") },
              { action: "snooze", title: t("actionSnooze") },
            ],
          };

    const outcome = await sendToUser(user.id, { ...message, lang: locale });

    /*
     * Značka „dnes už dostal svoje" jen tehdy, když to opravdu odešlo.
     *
     * Dřív se zapisovala vždycky. Výpadek poštovní služby prohlížeče tím
     * spálil celý den: příští běh za pět minut už toho člověka přeskočil,
     * protože značka tvrdila, že přišlo. Navenek to vypadalo, že
     * oznámení chodí, jak chtějí.
     *
     * Takhle se to v ranním okně zkouší dál, dokud to neprojde.
     */
    if (outcome.delivered > 0) {
      await mark(user.id, kind, today);
      sent += 1;
    } else if (outcome.errors.length > 0) {
      console.error(
        `[notify] ${user.id}: neodešlo na žádné zařízení —`,
        outcome.errors.join(" | "),
      );
    }
  }

  return { checked: users.length, sent, configured: true };
}

/**
 * Ranní zpráva.
 *
 * Nese myšlenku na den — nadpis je dnešní téma, tělo jeho první věta.
 * Pod ní jedna řádka o tom, co má člověk dnes před sebou.
 *
 * Tohle je ta část, kvůli které se ráno posílá i tomu, kdo žádný cíl
 * nemá. Připomínka úkolů by mu byla k ničemu; myšlenka na den ne —
 * a je docela možné, že právě jemu je k něčemu nejvíc.
 *
 * Nabídka založit cíl se přidává **jen v pondělí**. Každý den by z ní
 * byla výčitka a z oznámení otrava; jednou týdně je to nabídka. Ostatní
 * dny se jen popřeje hezký den a nic se nechce.
 */
async function morningMessage({
  t,
  locale,
  userId,
  createdAt,
  today,
  open,
  weekday,
  minutes,
}: {
  t: Awaited<ReturnType<typeof getTranslations>>;
  locale: Locale;
  userId: string;
  createdAt: Date;
  today: string;
  open: number;
  weekday: number;
  minutes: number;
}): Promise<{
  title: string;
  body: string;
  tag: string;
  url: string;
  actions: { action: string; title: string }[];
  actionUrls?: Record<string, string>;
}> {
  const tMotivation = await getTranslations({ locale, namespace: "motivation" });

  const pieces = motivationByLocale[locale] ?? [];
  const number = pieceNumberForDay(createdAt, parseIsoDate(today), pieces.length);
  const piece = number > 0 ? pieces[number - 1] : null;

  let context: string;
  let url = `/${locale}/app`;

  if (open > 0) {
    context = t("morningBody", { count: open });
  } else {
    const active = await db.goal.count({
      where: { userId, status: "ACTIVE" },
    });

    if (active > 0) {
      // Volno podle plánu, nebo den, na který se plán nedostal. Obojí
      // je v pořádku a nemá se z toho dělat výtka.
      context = t("restDay");
    } else {
      const lines = t.raw("noGoalLines") as string[];
      context =
        weekday === 1
          ? t("noGoalNudge")
          : (lines[number % lines.length] ?? lines[0]);
    }

  }

  /*
   * Klepnutí na oznámení otevře text, ne aplikaci.
   *
   * Původně vedlo do aplikace, kdykoliv na člověka čekaly úkoly, a text
   * si měl otevřít tlačítkem „Přečíst celé". Jenže tlačítka v oznámeních
   * neumí každý prohlížeč — Firefox je na počítači nekreslí vůbec
   * (`Notification.maxActions` je tam nula) — takže cesta k textu tam
   * prostě chyběla.
   *
   * Tudíž: co je v oznámení napsané, to se po klepnutí otevře. Úkoly
   * jsou v těle zmíněné a z textu vede odkaz do aplikace, takže se
   * k nim dostane každý, kdo o ně stojí. Obráceně to nešlo.
   *
   * Tlačítko zůstává pro prohlížeče, které ho umí; není na čem stavět,
   * ale kdo ho vidí, ušetří klepnutí.
   */
  if (piece) url = `/${locale}/motivation/${number}`;

  // Prázdná knihovna textů: zůstane původní připomínka.
  if (!piece) {
    return {
      title: t("morningTitle", { greeting: t(greetingKey(minutes)) }),
      body: context,
      tag: "almostthere-daily",
      url,
      actions: [
        { action: "open", title: t("actionOk") },
        { action: "snooze", title: t("actionSnooze") },
      ],
    };
  }

  /*
   * Tlačítko na celý text.
   *
   * V oznámení je jen první věta a bez tohohle nebylo kam pokračovat:
   * klepnutí na tělo vedlo do aplikace, protože tam čekají úkoly, a ten,
   * kdo si chtěl text dočíst, ho musel hledat. Tlačítko má proto vlastní
   * cíl — viz `actionUrls` v service workeru.
   *
   * „Jasně" tu být přestalo. Dělalo totéž co klepnutí na oznámení a
   * zabíralo jedno ze dvou míst, která prohlížeč na tlačítka dá.
   */
  const read = `/${locale}/motivation/${number}`;

  /*
   * Stavba oznámení.
   *
   * Dřív to byl jeden odstavec: první věta myšlenky a hned za ní
   * informace o aplikaci. Nedalo se poznat, kde jedno končí a druhé
   * začíná — nejvíc na počítači, kde se zobrazí celé.
   *
   * Nadpis teď myšlenku pojmenuje („Myšlenka na den: …"), takže je
   * rovnou jasné, co se čte. Oslovení se střídá, aby to po třech
   * týdnech nebyla tapeta, kterou oko přeskočí.
   */
  const labels = tMotivation.raw("labels") as string[];
  const label = labels[labelIndexForDay(number, labels.length)] ?? labels[0];

  return {
    title: `${label}: ${piece.title}`,
    body: `${teaser(piece.paragraphs)}
${SEPARATOR}
${context}`,
    tag: "almostthere-daily",
    url,
    actions: [
      { action: "read", title: t("actionRead") },
      { action: "snooze", title: t("actionSnooze") },
    ],
    actionUrls: { read },
  };
}

function mark(userId: string, kind: "morning" | "evening", today: string) {
  return db.user.update({
    where: { id: userId },
    data:
      kind === "morning"
        ? { notifiedOn: today, notifySnoozedUntil: null }
        : { notifiedEveningOn: today },
  });
}
