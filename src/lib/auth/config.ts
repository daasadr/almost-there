import type { NextAuthConfig } from "next-auth";

/**
 * Část konfigurace, která musí fungovat i v middleware.
 *
 * Middleware běží v Edge runtimu, kde nejde spustit Prisma ani bcrypt.
 * Proto je konfigurace rozdělená: tady zůstává jen to, co Edge zvládne
 * (callbacky, cesty), a poskytovatelé s databází se přidávají až
 * v `src/auth.ts`, které se importuje pouze v Node runtimu.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    // JWT, ne databázové sessions — middleware tak ověří přihlášení
    // bez dotazu do databáze, což by v Edge runtimu ani nešlo.
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dnů
  },
  callbacks: {
    /**
     * Do tokenu si uložíme jen to, co potřebujeme v UI a v middleware.
     * Stav předplatného sem patří, aby se paywall dal vyhodnotit bez
     * dotazu do databáze při každém požadavku.
     */
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.isEmailVerified = Boolean(
          (user as { emailVerified?: Date | null }).emailVerified,
        );
        token.subscriptionStatus =
          (user as { subscriptionStatus?: string }).subscriptionStatus ??
          "NONE";
      }

      // Po zaplacení nebo ověření e-mailu se token obnoví bez odhlášení.
      if (trigger === "update" && session) {
        if (typeof session.isEmailVerified === "boolean") {
          token.isEmailVerified = session.isEmailVerified;
        }
        if (typeof session.subscriptionStatus === "string") {
          token.subscriptionStatus = session.subscriptionStatus;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
        session.user.subscriptionStatus = String(
          token.subscriptionStatus ?? "NONE",
        );
      }
      return session;
    },
  },
  // Poskytovatele doplňuje src/auth.ts — tady zůstává prázdné,
  // protože Credentials potřebuje databázi a ta v Edge runtimu není.
  providers: [],
} satisfies NextAuthConfig;
