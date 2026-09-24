import "server-only";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getToday } from "@/lib/goals/queries";
import { parseIsoDate, todayIso } from "@/lib/plan/calendar";
import { motivationByLocale } from "@/content/motivation";
import { pieceNumberForDay, teaser } from "@/lib/motivation";
import { sendToUser } from "./push";
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

/** Jak dlouho po nastaveném čase ještě má smysl posílat. */
const WINDOW_MINUTES = 30;

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

export type DispatchResult = { checked: number; sent: number };

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
          };

    const delivered = await sendToUser(user.id, {
      ...message,
      lang: locale,
      actions: [
        { action: "open", title: t("actionOk") },
        { action: "snooze", title: t("actionSnooze") },
      ],
    });

    await mark(user.id, kind, today);
    if (delivered > 0) sent += 1;
  }

  return { checked: users.length, sent };
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
}): Promise<{ title: string; body: string; tag: string; url: string }> {
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

    // V aplikaci by nebylo co dělat, tak ať klepnutí otevře rovnou text.
    if (piece) url = `/${locale}/motivation/${number}`;
  }

  // Prázdná knihovna textů: zůstane původní připomínka.
  if (!piece) {
    return {
      title: t("morningTitle", { greeting: t(greetingKey(minutes)) }),
      body: context,
      tag: "almostthere-daily",
      url,
    };
  }

  return {
    title: piece.title,
    body: `${teaser(piece.paragraphs)}

${context}`,
    tag: "almostthere-daily",
    url,
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
