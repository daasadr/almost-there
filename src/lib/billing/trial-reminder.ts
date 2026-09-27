import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { buildTrialEndingEmail } from "@/lib/email/templates";
import { siteUrl } from "@/lib/seo/site";
import { TRIAL_REMINDER_DAYS_BEFORE } from "@/lib/stripe/plans";
import type { Locale } from "@/i18n/routing";

/**
 * Připomínka, že za dva dny skončí zkušební období.
 *
 * Tohle je ta jediná věc, která dělá rozdíl mezi poctivou zkouškou
 * a pastí na zapomnětlivé. Zkouška přejde v placené sama — což je
 * v pořádku, pokud o tom člověk ví včas a zrušit to je otázka jednoho
 * kliknutí. Bez připomínky by první zprávou byla strhnutá platba, a to
 * je přesně ten druh překvapení, po kterém lidé nadávají veřejně.
 *
 * Rozesílá se ze stejné úlohy jako ranní oznámení, tedy každých pár
 * minut. Značka `trialReminderSentAt` hlídá, že e-mail odejde jednou.
 *
 * Mlčí u toho, kdo už zrušil: takovému se nic nestrhne a připomínat mu
 * konec něčeho, co sám ukončil, je obtěžování.
 */

export type TrialReminderResult = { checked: number; sent: number };

export async function sendTrialReminders(): Promise<TrialReminderResult> {
  const now = Date.now();
  const until = new Date(now + TRIAL_REMINDER_DAYS_BEFORE * 86_400_000);

  const users = await db.user.findMany({
    where: {
      subscriptionStatus: "TRIAL",
      // Zrušenou zkoušku nepřipomínáme — nic se nestrhne.
      subscriptionCancelAtPeriodEnd: false,
      trialReminderSentAt: null,
      deletedAt: null,
      subscriptionEndsAt: { not: null, lte: until, gt: new Date(now) },
    },
    select: {
      id: true,
      email: true,
      name: true,
      locale: true,
      subscriptionEndsAt: true,
    },
  });

  let sent = 0;

  for (const user of users) {
    if (!user.email || !user.subscriptionEndsAt) continue;

    const locale = (["cs", "de"].includes(user.locale)
      ? user.locale
      : "en") as Locale;

    const mail = await buildTrialEndingEmail({
      locale,
      name: user.name ?? "",
      endsAt: user.subscriptionEndsAt,
      accountUrl: `${siteUrl()}/${locale}/app/account`,
    });

    const result = await sendEmail({ to: user.email, ...mail });

    /*
     * Značka se zapisuje jen po úspěšném odeslání.
     *
     * Kdyby se zapsala vždycky, výpadek poštovní služby by znamenal, že
     * se připomínka nepošle nikdy — a uživatel se o platbě dozví až
     * z výpisu. Takhle se to příští běh zkusí znovu; nejhůř přijde
     * o pár minut později.
     */
    if (result.ok) {
      await db.user.update({
        where: { id: user.id },
        data: { trialReminderSentAt: new Date() },
      });
      sent += 1;
    } else {
      console.error("[trial] připomínka neodešla", user.id, result.error);
    }
  }

  return { checked: users.length, sent };
}
