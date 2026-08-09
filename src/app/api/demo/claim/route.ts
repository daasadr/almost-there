import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { claimDemoGoal, DemoExpiredError } from "@/lib/goals/claim";
import { isGoalColor } from "@/lib/plan/colors";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const bodySchema = z.object({
  /** `false` odkaz jen zahodí — uživatel demo cíl nechce. */
  claim: z.boolean(),
  color: z.string().optional(),
  importance: z.number().int().min(1).max(5).optional(),
  description: z.string().max(2000).optional(),
});

/** Převzetí cíle z dema, nebo jeho zahození. */
export async function POST(request: Request) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  const jar = await cookies();
  const demoGoalId = jar.get("demoGoal")?.value;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const clearCookie = (response: NextResponse) => {
    response.cookies.set("demoGoal", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: env.isProduction,
      path: "/",
      maxAge: 0,
    });
    return response;
  };

  // Zahození: odkaz pryč, uložené rozfázování necháme dožít samo.
  if (!parsed.data.claim) {
    return clearCookie(NextResponse.json({ ok: true, discarded: true }));
  }

  if (!demoGoalId) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  // Limit běžících cílů platí i tady — jinak by se přes demo dal obejít.
  const activeCount = await db.goal.count({
    where: { userId: guard.user.id, status: "ACTIVE" },
  });
  if (activeCount >= env.maxActiveGoals) {
    return NextResponse.json(
      { ok: false, error: "tooManyGoals" },
      { status: 409 },
    );
  }

  try {
    const goalId = await claimDemoGoal({
      userId: guard.user.id,
      demoGoalId,
      color: isGoalColor(parsed.data.color) ? parsed.data.color : "lime",
      importance: parsed.data.importance ?? 3,
      description: parsed.data.description,
    });

    return clearCookie(NextResponse.json({ ok: true, goalId }));
  } catch (error) {
    if (error instanceof DemoExpiredError) {
      // Odkaz zahodíme — ukazuje na něco, co už převzít nejde.
      return clearCookie(
        NextResponse.json({ ok: false, error: "notFound" }, { status: 409 }),
      );
    }

    console.error("[demo] převzetí selhalo", error);
    return NextResponse.json({ ok: false, error: "generic" }, { status: 500 });
  }
}
