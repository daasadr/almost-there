import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  checkRateLimit,
  getClientIp,
  hashIp,
} from "@/lib/rate-limit";
import {
  demoRequestSchema,
  validateGoal,
  validateTargetDate,
  type DemoErrorKey,
} from "@/lib/demo-validation";
import { decomposeGoal } from "@/lib/ai/decompose";
import { mockDecomposeGoal } from "@/lib/ai/mock";
import type { Plan } from "@/lib/ai/schemas";

/**
 * Demo endpoint — fáze 1 rozpadu (měsíční milníky) bez registrace.
 *
 * Záměrně negeneruje týdenní ani denní úroveň: demo má ukázat kvalitu
 * rozpadu, ne nahradit plnou verzi (zadání, bod 8).
 */

export const runtime = "nodejs";
// Rozpad trvá řádově desítky sekund; výchozí limit by ho uřízl.
export const maxDuration = 120;

type DemoSuccess = { ok: true; plan: Plan };
type DemoFailure = { ok: false; error: DemoErrorKey };

function fail(error: DemoErrorKey, status: number) {
  return NextResponse.json<DemoFailure>({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("generic", 400);
  }

  const parsed = demoRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("generic", 400);
  }

  const { goal, targetDate, locale } = parsed.data;

  const goalError = validateGoal(goal);
  if (goalError) return fail(goalError, 400);

  const dateError = validateTargetDate(targetDate);
  if (dateError) return fail(dateError, 400);

  // Strop na IP: demo běží bez účtu, takže tohle je jediná ochrana
  // našeho API klíče před skriptem, který by ho vysál.
  const ipKey = `demo:${hashIp(getClientIp(request.headers))}`;
  const limit = checkRateLimit(ipKey, env.demoRateLimitPerHour);
  if (!limit.allowed) {
    return NextResponse.json<DemoFailure>(
      { ok: false, error: "rateLimited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  try {
    const result = env.demoMock
      ? await mockDecomposeGoal({
          goal: goal.trim(),
          targetDate,
          locale,
        })
      : await decomposeGoal({
          goal: goal.trim(),
          targetDate,
          locale,
        });

    // TODO (další vrstva): uložit jako DemoGoal a evidovat AiUsageEvent,
    // aby šel demo cíl po zaplacení převzít do plné verze (zadání 8).
    return NextResponse.json<DemoSuccess>({ ok: true, plan: result.plan });
  } catch (error) {
    console.error("[demo] decomposition failed", error);
    return fail("aiFailed", 502);
  }
}
