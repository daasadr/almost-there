import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timingSafeEqual } from "node:crypto";
import { dispatchReminders } from "@/lib/notify/dispatch";
import { sendTrialReminders } from "@/lib/billing/trial-reminder";

export const runtime = "nodejs";
// Projít všechny uživatele a rozeslat chvíli trvá.
export const maxDuration = 300;

/**
 * Spouštěč rozesílání připomínek.
 *
 * Volá se zvenčí, každých pár minut — úlohou v systému na serveru:
 *
 *   *\/5 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
 *     https://almost-there.eu/api/cron/notify > /dev/null
 *
 * Časovač uvnitř aplikace by nepřežil nasazení: webový server se při
 * něm restartuje a s ním by zmizel i časovač. Navíc by při dvou
 * instancích běžel dvakrát a lidé by dostávali oznámení dvojmo.
 *
 * Kdo si sem otevře cestu bez hesla, může uživatelům rozesílat oznámení,
 * takže je to chráněné sdíleným tajemstvím. Bez nastaveného tajemství
 * se nedělá nic — otevřený koncový bod je horší než žádný.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "notConfigured" },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const offered = header.startsWith("Bearer ") ? header.slice(7) : "";

  // Porovnání odolné proti měření času. Délku je potřeba srovnat zvlášť,
  // `timingSafeEqual` na různě dlouhých vstupech vyhodí výjimku.
  const a = Buffer.from(offered);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await dispatchReminders();

  /*
   * Ze stejné úlohy jede i upozornění na konec zkušebního období.
   *
   * Vlastní cron by znamenal druhý řádek v `crontab`, druhé tajemství
   * a druhou věc, na kterou se dá zapomenout při přeinstalaci serveru.
   * Obojí je rozesílání e-mailu podle času, tak ať to má jeden spouštěč.
   */
  const trials = await sendTrialReminders();

  /*
   * Zápis, že úloha proběhla.
   *
   * Když se cron rozbije, nic nespadne a nic se nenahlásí — jen přestanou
   * chodit zprávy. Tenhle řádek je jediný způsob, jak to poznat dřív, než
   * se někdo zeptá „proč mi nic nepřišlo". Je vidět ve správě.
   */
  await db.cronRun.upsert({
    where: { job: "notify" },
    create: {
      job: "notify",
      ranAt: new Date(),
      note: `prošlo ${result.checked}, odesláno ${result.sent}`,
    },
    update: {
      ranAt: new Date(),
      note: `prošlo ${result.checked}, odesláno ${result.sent}`,
    },
  });

  return NextResponse.json({ ok: true, ...result, trials });
}

/** Aby šlo volat i obyčejným `curl` bez `-X POST`. */
export const GET = POST;
