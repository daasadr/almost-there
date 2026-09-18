import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { dispatchReminders } from "@/lib/notify/dispatch";

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
  return NextResponse.json({ ok: true, ...result });
}

/** Aby šlo volat i obyčejným `curl` bez `-X POST`. */
export const GET = POST;
