import { NextResponse } from "next/server";
import { z } from "zod";
import { deactivateLicense, RENEW_STATUS } from "@/lib/visionboard/renew";
import { checkRateLimit, getClientIp, hashIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Uvolnění zařízení.
 *
 * Aplikace si licenci maže u sebe tak jako tak; tohle volání jen říká
 * nám, že se místo uvolnilo. Proto se odpovídá úspěchem i tehdy, když
 * instalace už deaktivovaná byla — chyba by ze zdvořilosti udělala
 * překážku a uživatel by zůstal se zařízením, které nejde odebrat.
 *
 * Kontrakt: `docs/visionboard-api.md`, oddíl 3.3.
 */

const bodySchema = z.object({
  license: z.string().min(1).max(4096),
});

const PER_MINUTE = 30;

export async function POST(request: Request) {
  const limit = checkRateLimit(
    `vb-deactivate:${hashIp(getClientIp(request.headers))}`,
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
    const result = await deactivateLicense(parsed.data.license);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: RENEW_STATUS[result.error] },
      );
    }

    // 204: hotovo a není co vracet.
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[visionboard] deaktivace selhala", error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
