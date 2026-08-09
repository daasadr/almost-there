import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema, type AuthErrorKey } from "@/lib/auth/validation";
import { verifyPasswordResetToken } from "@/lib/auth/tokens";

export const runtime = "nodejs";

const BCRYPT_ROUNDS = 12;

function fail(error: AuthErrorKey, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Nastavení nového hesla podle tokenu z e-mailu. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("generic", 400);
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(
      issue?.path[0] === "password" ? "passwordTooShort" : "tokenInvalid",
      400,
    );
  }

  const result = await verifyPasswordResetToken(parsed.data.token);
  if (!result.ok) {
    return fail(result.reason === "expired" ? "tokenExpired" : "tokenInvalid", 400);
  }

  const passwordHash = await hash(parsed.data.password, BCRYPT_ROUNDS);

  await db.$transaction([
    db.user.update({
      where: { id: result.userId },
      data: {
        passwordHash,
        // Kdo si nastavil heslo z odkazu v e-mailu, prokázal přístup
        // k té adrese — takže ji tím zároveň ověřil.
        emailVerified: new Date(),
        // Všechna dřívější přihlášení tím padají. Kdo měnil heslo proto,
        // že se mu někdo dostal do účtu, ho tím zároveň vyhodí.
        sessionsValidFrom: new Date(),
      },
    }),
    db.passwordResetToken.update({
      where: { id: result.tokenId },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
