import { NextResponse } from "next/server";
import { z } from "zod";
import { renewLicense, RENEW_STATUS } from "@/lib/visionboard/renew";
import { checkRateLimit, getClientIp, hashIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Prodloužení platnosti licence.
 *
 * Aplikace si o to řekne sama, 14 dní před koncem a nejvýš jednou
 * denně, takže uživatel o téhle cestě neví. Průkazem je stávající
 * licence; žádné přihlášení tu není, protože aplikace žádné nedrží.
 *
 * Kontrakt: `docs/visionboard-api.md`, oddíl 3.2.
 */

const bodySchema = z.object({
  license: z.string().min(1).max(4096),
});

/**
 * Strop kontrakt nežádá, ale endpoint ověřuje podpisy bez přihlášení.
 * Třicet za minutu je nad poctivým provozem o několik řádů — aplikace
 * sem chodí jednou za čtrnáct dní.
 */
const PER_MINUTE = 30;

export async function POST(request: Request) {
  const limit = checkRateLimit(
    `vb-renew:${hashIp(getClientIp(request.headers))}`,
    PER_MINUTE,
    60_000,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: RENEW_STATUS.invalid_request },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: RENEW_STATUS.invalid_request },
    );
  }

  try {
    const result = await renewLicense(parsed.data.license);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: RENEW_STATUS[result.error] },
      );
    }

    return NextResponse.json({ license: result.license });
  } catch (error) {
    console.error("[visionboard] obnova licence selhala", error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
