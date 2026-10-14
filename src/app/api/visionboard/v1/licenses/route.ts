import { NextResponse } from "next/server";
import { z } from "zod";
import {
  activateInstallation,
  ATTEMPTS_PER_MINUTE,
  ATTEMPT_WINDOW_MS,
  ERROR_STATUS,
  type ActivationError,
} from "@/lib/visionboard/activate";
import { checkRateLimit, getClientIp, hashIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Výměna aktivačního kódu za licenci Vision Boardu.
 *
 * Volá to desktopová aplikace, ne prohlížeč. Proto tu nejsou cookies,
 * není tu CORS a nehlídá se přihlášená relace — kdo zná kód a tajemství,
 * ke kterému ten kód patří, má nárok. Kdyby se sem posílaly hlavičky
 * `Access-Control-*`, znamenalo by to, že endpoint jde volat z cizí
 * stránky v prohlížeči uživatele; proto se neposílají.
 *
 * Kontrakt: `docs/visionboard-api.md`, oddíl 3.1.
 */

const bodySchema = z.object({
  /** Může přijít s pomlčkami i malými písmeny, normalizuje se níž. */
  code: z.string().min(1).max(40),
  verifier: z.string().min(1).max(200),
  installationId: z.string().min(1).max(100),
  platform: z.enum(["windows", "macos", "linux"]),
  /** Jen pro přehled; na rozhodování nemá vliv. */
  appVersion: z.string().max(40).optional(),
});

function fail(error: ActivationError) {
  return NextResponse.json({ ok: false, error }, { status: ERROR_STATUS[error] });
}

export async function POST(request: Request) {
  /*
   * Strop se počítá dřív, než se cokoliv přečte.
   *
   * Smysl je, aby ani neúspěšné pokusy nestály práci. Kód sám se spálí
   * při prvním uplatnění, takže hádat ho nejde — tohle je vrstva pod
   * tím, hlavně proti tomu, aby někdo endpoint zahltil.
   */
  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(
    `vb-licenses:${hashIp(ip)}`,
    ATTEMPTS_PER_MINUTE,
    ATTEMPT_WINDOW_MS,
  );

  if (!limit.allowed) {
    const seconds = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      // `Retry-After` kontrakt nežádá, ale je to jediný způsob, jak
      // aplikaci říct, kdy to má zkusit znovu, místo aby hádala.
      { status: ERROR_STATUS.rate_limited, headers: { "Retry-After": String(seconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_request");
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return fail("invalid_request");

  try {
    const result = await activateInstallation(parsed.data);
    if (!result.ok) return fail(result.error);

    return NextResponse.json({ license: result.license });
  } catch (error) {
    /*
     * Chybějící podpisový klíč sem spadne taky.
     *
     * Aplikaci se nesmí říct nic bližšího — ta nemá co vědět, co se
     * u nás nepovedlo. Do logu ale patří všechno, protože tohle je
     * jediné místo, kde se taková porucha projeví.
     */
    console.error("[visionboard] aktivace selhala", error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
