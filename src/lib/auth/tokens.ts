import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Jednorázové tokeny pro ověření e-mailu a reset hesla.
 *
 * V databázi je vždy jen otisk, nikdy samotný token. Kdo by získal přístup
 * k databázi, nemůže z otisku token spočítat zpátky — a tedy ani převzít
 * cizí účet přes odkaz pro reset hesla.
 */

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hodin
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hodina

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  // 32 bajtů náhody v base64url — dost na to, aby token nešlo uhodnout,
  // a zároveň se to vejde do URL bez kódování.
  return randomBytes(32).toString("base64url");
}

/** Porovnání odolné vůči měření času. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// --- Ověření e-mailové adresy ---------------------------------------------

export async function createVerificationToken(email: string): Promise<string> {
  const token = generateToken();

  // Starší tokeny pro tuhle adresu zneplatníme — po opakovaném odeslání
  // má fungovat jen ten nejnovější odkaz.
  await db.verificationToken.deleteMany({ where: { identifier: email } });

  await db.verificationToken.create({
    data: {
      identifier: email,
      token: hashToken(token),
      expires: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  return token;
}

export type VerificationResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" };

export async function consumeVerificationToken(
  token: string,
): Promise<VerificationResult> {
  const record = await db.verificationToken.findUnique({
    where: { token: hashToken(token) },
  });

  if (!record) return { ok: false, reason: "invalid" };

  // Token mažeme i když je propadlý, ať se v databázi nehromadí.
  await db.verificationToken.deleteMany({ where: { token: record.token } });

  if (record.expires.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, email: record.identifier };
}

// --- Reset hesla -----------------------------------------------------------

export async function createPasswordResetToken(
  userId: string,
): Promise<string> {
  const token = generateToken();

  // Nepoužité tokeny označíme za spotřebované — platit má jen ten poslední.
  await db.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  await db.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  return token;
}

export type ResetTokenResult =
  | { ok: true; userId: string; tokenId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

export async function verifyPasswordResetToken(
  token: string,
): Promise<ResetTokenResult> {
  const hash = hashToken(token);
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hash },
  });

  if (!record || !safeEqual(record.tokenHash, hash)) {
    return { ok: false, reason: "invalid" };
  }
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, userId: record.userId, tokenId: record.id };
}
