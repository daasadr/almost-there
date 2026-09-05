import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { createPasswordResetToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { buildPasswordResetEmail } from "@/lib/email/templates";
import { checkRateLimit, getClientIp, hashIp } from "@/lib/rate-limit";
import { routing, type Locale } from "@/i18n/routing";

export const runtime = "nodejs";

/**
 * Žádost o reset hesla.
 *
 * Odpověď je vždy stejná, ať účet existuje nebo ne. Kdyby se lišila, dal by
 * se tímhle endpointem zjišťovat, které adresy jsou zaregistrované.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "emailInvalid" },
      { status: 400 },
    );
  }

  const limit = checkRateLimit(
    `forgot:${hashIp(getClientIp(request.headers))}`,
    5,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rateLimited" },
      { status: 429 },
    );
  }

  const bodyLocale = (body as { locale?: string }).locale;
  const locale: Locale = hasLocale(routing.locales, bodyLocale)
    ? bodyLocale
    : routing.defaultLocale;

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  /**
   * Posílá se i účtům založeným přes Google, které heslo zatím nemají.
   *
   * Původně se jim odpověď mlčky zahodila — heslo není co resetovat.
   * Jenže v aplikaci z obchodu se Googlem přihlásit nedá: běží ve
   * webview a Google v něm přihlášení zakazuje. Takový účet pak neměl
   * do aplikace jak dovnitř a neexistovala ani cesta, jak si to spravit.
   *
   * Bezpečnostně se nic nemění. Kdo má přístup k té schránce, může si
   * u Googlu stejně nechat obnovit heslo a přihlásit se tudy — e-mail
   * je u obou cest ten samý důkaz vlastnictví. Původní účet přes Google
   * zůstává funkční, heslo se k němu jen přidá jako druhá cesta.
   */
  if (user && !user.deletedAt) {
    const token = await createPasswordResetToken(user.id);
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      .replace(/\/+$/, "");
    const resetUrl = `${base}/${locale}/reset-password?token=${encodeURIComponent(token)}`;

    const mail = await buildPasswordResetEmail(locale, resetUrl);
    await sendEmail({ to: user.email, ...mail });
  }

  return NextResponse.json({ ok: true });
}
