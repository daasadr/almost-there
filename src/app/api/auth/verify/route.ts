import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/auth/tokens";
import type { AuthErrorKey } from "@/lib/auth/validation";

export const runtime = "nodejs";

/** Potvrzení e-mailové adresy odkazem z e-mailu. */
export async function POST(request: Request) {
  let token: string | undefined;
  try {
    token = (await request.json())?.token;
  } catch {
    return NextResponse.json(
      { ok: false, error: "generic" satisfies AuthErrorKey },
      { status: 400 },
    );
  }

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "tokenInvalid" satisfies AuthErrorKey },
      { status: 400 },
    );
  }

  const result = await consumeVerificationToken(token);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: (result.reason === "expired"
          ? "tokenExpired"
          : "tokenInvalid") satisfies AuthErrorKey,
      },
      { status: 400 },
    );
  }

  await db.user.update({
    where: { email: result.email },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ ok: true });
}
