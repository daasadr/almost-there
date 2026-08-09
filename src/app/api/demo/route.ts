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
import { formatUsage } from "@/lib/ai/cost";
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

const DAY_MS = 24 * 60 * 60 * 1000;

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

  // Dvě pojistky nad sebou. Strop na adresu odradí zvědavce, kterému by
  // jinak nevadilo vygenerovat dvacet variant; celkový denní strop chrání
  // před tím, kdo si adresy umí měnit. Demo běží bez účtu a každé volání
  // stojí skutečné peníze, takže jedna vrstva nestačí.
  const today = new Date().toISOString().slice(0, 10);
  const global = checkRateLimit(
    `demo:global:${today}`,
    env.demoGlobalLimitPerDay,
    DAY_MS,
  );

  const ipKey = `demo:${hashIp(getClientIp(request.headers))}`;
  const limit = global.allowed
    ? checkRateLimit(ipKey, env.demoLimitPerDay, DAY_MS)
    : global;

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

    // Spotřebu logujeme už teď, i když ji zatím nikam neukládáme —
    // bez reálných čísel se strop podle bodu 9 zadání nastavit nedá.
    console.log(
      formatUsage(
        `demo level=${result.plan.level} obdobi=${result.plan.periods.length}`,
        result.usage,
      ),
    );

    // TODO (další vrstva): uložit jako DemoGoal a evidovat AiUsageEvent,
    // aby šel demo cíl po zaplacení převzít do plné verze (zadání 8).
    return NextResponse.json<DemoSuccess>({ ok: true, plan: result.plan });
  } catch (error) {
    console.error("[demo] decomposition failed", error);
    return fail("aiFailed", 502);
  }
}
