import "server-only";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getToday } from "@/lib/goals/queries";
import { todayIso } from "@/lib/plan/calendar";
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
     * Bez otevřených úkolů se mlčí.
     *
     * Ráno to znamená volno podle plánu nebo den, na který se plán
     * nedostal; večer, že je hotovo. Ani v jednom případě není co
     * připomínat a oznámení „nemáš nic“ je přesně ten druh zprávy,
     * po kterém si lidé připomínky vypnou.
     *
     * Značka se přesto zapíše — aby se to za pět minut nezkoušelo znovu.
     */
    if (open === 0) {
      await mark(user.id, kind, today);
      continue;
    }

    const { minutes } = localNow(user.timezone);

    const message =
      kind === "morning"
        ? {
            title: t("morningTitle", { greeting: t(greetingKey(minutes)) }),
            body: t("morningBody", { count: open }),
            tag: "almostthere-daily",
          }
        : {
            title: t("eveningTitle"),
            body: t("eveningBody", { count: open }),
            tag: "almostthere-evening",
          };

    const delivered = await sendToUser(user.id, {
      ...message,
      url: `/${locale}/app`,
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

function mark(userId: string, kind: "morning" | "evening", today: string) {
  return db.user.update({
    where: { id: userId },
    data:
      kind === "morning"
        ? { notifiedOn: today, notifySnoozedUntil: null }
        : { notifiedEveningOn: today },
  });
}
