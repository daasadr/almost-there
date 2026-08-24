import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema, type AuthErrorKey } from "@/lib/auth/validation";
import { findPasswordProblem } from "@/lib/auth/password-strength";
import { createVerificationToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { buildVerificationEmail } from "@/lib/email/templates";
import { checkRateLimit, getClientIp, hashIp } from "@/lib/rate-limit";
import { LEGAL_VERSION } from "@/content/legal";
import { routing, type Locale } from "@/i18n/routing";
import { hasLocale } from "next-intl";

export const runtime = "nodejs";

/**
 * Registrace e-mailem a heslem.
 *
 * Součástí je povinný souhlas s podmínkami a zásadami zpracování údajů —
 * ukládá se i s verzí dokumentu, jinak by nešlo doložit, s čím uživatel
 * souhlasil (zadání, bod 13).
 */

/** Náklad hashování. 12 je rozumný kompromis mezi bezpečností a latencí. */
const BCRYPT_ROUNDS = 12;

function fail(error: AuthErrorKey, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

function isKnownTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("generic", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    // Souhlas řešíme zvlášť, ať uživatel dostane konkrétní hlášku.
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === "consent") return fail("consentRequired", 400);
    if (issue?.path[0] === "email") return fail("emailInvalid", 400);
    if (issue?.path[0] === "password") return fail("passwordTooShort", 400);
    if (issue?.path[0] === "name") return fail("nameRequired", 400);
    return fail("generic", 400);
  }

  const { name, email, password } = parsed.data;

  /**
   * Heslo, které už někde uniklo, projde na délku, ale útočníkovi ho
   * stačí opsat ze seznamu. Kontroluje se až tady, na serveru: potřebuje
   * to síť a nemá cenu s tím zdržovat psaní ve formuláři.
   */
  const problem = await findPasswordProblem(password, email);
  if (problem === "tooCommon") return fail("passwordTooCommon", 400);
  if (problem === "tooPersonal") return fail("passwordTooPersonal", 400);

  // Registrace vytváří účet a posílá e-mail — obojí stojí zdroje,
  // takže strop na IP proti automatizovanému zakládání účtů.
  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(`register:${hashIp(ip)}`, 10);
  if (!limit.allowed) return fail("rateLimited", 429);

  // Pásmo z prohlížeče. Ověřuje se proti systému, ne proti vlastnímu
  // seznamu — ten by zastaral a odmítal by platná pásma.
  const bodyTimezone = (body as { timezone?: string }).timezone;
  const timezone =
    typeof bodyTimezone === "string" && isKnownTimeZone(bodyTimezone)
      ? bodyTimezone
      : "Europe/Prague";

  const bodyLocale = (body as { locale?: string }).locale;
  const locale: Locale = hasLocale(routing.locales, bodyLocale)
    ? bodyLocale
    : routing.defaultLocale;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Že je adresa obsazená, říkáme nahlas. Skrývat to by znamenalo, že
    // uživatel s existujícím účtem neví, proč se nemůže zaregistrovat,
    // a to je horší než informace, kterou stejně zjistí přes reset hesla.
    return fail("emailTaken", 409);
  }

  const passwordHash = await hash(password, BCRYPT_ROUNDS);
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;
  const ipHash = hashIp(ip);

  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      authProvider: "CREDENTIALS",
      locale,
      timezone,
      consents: {
        create: [
          {
            type: "TERMS",
            version: LEGAL_VERSION,
            granted: true,
            ipAddress: ipHash,
            userAgent,
          },
          {
            type: "PRIVACY",
            version: LEGAL_VERSION,
            granted: true,
            ipAddress: ipHash,
            userAgent,
          },
        ],
      },
    },
  });

  const token = await createVerificationToken(user.email);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .replace(/\/+$/, "");
  const verifyUrl = `${base}/${locale}/verify?token=${encodeURIComponent(token)}`;

  const mail = await buildVerificationEmail(locale, verifyUrl, name);
  const sent = await sendEmail({ to: user.email, ...mail });

  if (!sent.ok) {
    // Účet zůstává — uživatel si může nechat e-mail poslat znovu.
    // Selhání odeslání nesmí zahodit už vytvořenou registraci.
    console.error("[register] ověřovací e-mail se nepodařilo odeslat");
  }

  return NextResponse.json({ ok: true });
}
