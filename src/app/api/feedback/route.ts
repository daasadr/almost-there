import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isStoreApp } from "@/lib/store-app";
import { MAX_LENGTH, PER_HOUR } from "@/lib/feedback/limits";
import {
  pathFromReferer,
  submitFeedback,
  trimUserAgent,
} from "@/lib/feedback/submit";

export const runtime = "nodejs";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Tělo nese jen text a jazyk rozhraní.
 *
 * Všechno ostatní — ze které stránky to přišlo, jestli jde o aplikaci
 * z obchodu — si server zjistí sám. Z těla požadavku by se to dalo
 * podvrhnout a hledala by se pak chyba na stránce, které se netýká.
 *
 * Horní mez je tu i ve schématu, ne jen v `submitFeedback`: dva mega
 * textu nemá smysl vůbec rozbalovat.
 */
const bodySchema = z.object({
  message: z.string().min(1).max(MAX_LENGTH + 100),
  locale: z.enum(["cs", "en", "de"]),
});

/** Hlášení od uživatele: cokoliv, co nefunguje nebo zlobí. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Na účet, ne na IP. Přihlášení je podmínka, takže účet je přesnější
  // a nepostihne dva lidi za jedním připojením.
  const limit = checkRateLimit(`feedback:${session.user.id}`, PER_HOUR, HOUR_MS);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "tooMany" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const result = await submitFeedback({
    userId: session.user.id,
    message: parsed.data.message,
    context: {
      path: pathFromReferer(request.headers.get("referer")),
      locale: parsed.data.locale,
      storeApp: isStoreApp(request.headers),
      userAgent: trimUserAgent(request.headers.get("user-agent")),
    },
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
