import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { hasLocale } from "next-intl";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { routing } from "@/i18n/routing";

/**
 * Middleware dělá dvě věci najednou: řeší jazyk v URL a hlídá přístup
 * do chráněné oblasti.
 *
 * Autentizace se sem přidává přes `authConfig` bez poskytovatelů —
 * middleware běží v Edge runtimu, kde Prisma ani bcrypt nefungují.
 * Ověřuje se jen podpis JWT, což Edge zvládne.
 */

const intlMiddleware = createIntlMiddleware(routing);
const { auth } = NextAuth(authConfig);

/**
 * Cesty (bez jazykového prefixu), které vyžadují přihlášení.
 *
 * `/admin` je tu jen kvůli tomu, aby nepřihlášený skončil na přihlášení
 * místo na chybové stránce. Že je někdo správce, se ověřuje až na serveru —
 * middleware má k dispozici jen podpis tokenu, ne databázi.
 */
const PROTECTED_PREFIXES = ["/app", "/admin"];

/** Cesty, které nemá smysl ukazovat přihlášenému uživateli. */
const GUEST_ONLY = ["/login", "/register", "/forgot-password"];

export default auth((request) => {
  const { pathname } = request.nextUrl;

  // Z cesty odloupneme jazyk, ať se pravidla píšou jednou, ne pro každý jazyk.
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const locale = hasLocale(routing.locales, first)
    ? first
    : routing.defaultLocale;
  const path = hasLocale(routing.locales, first)
    ? `/${segments.slice(1).join("/")}`
    : pathname;

  const isLoggedIn = Boolean(request.auth);

  if (
    !isLoggedIn &&
    PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))
  ) {
    const url = new URL(`/${locale}/login`, request.nextUrl);
    // Kam se vrátit po přihlášení — ať uživatel nepřistane na rozcestí.
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && GUEST_ONLY.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.redirect(new URL(`/${locale}/app`, request.nextUrl));
  }

  return intlMiddleware(request);
});

export const config = {
  // Vše kromě API, statických souborů Next.js a souborů s příponou.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
