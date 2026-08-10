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
     * Do tokenu patří jen to, co se během přihlášení nemění.
     *
     * Stav předplatného sem výslovně NEPATŘÍ: mění ho webhook od Stripu,
     * tedy zvenčí, a token by o tom nevěděl. Uživatel by zaplatil a paywall
     * by mu zůstal až do dalšího přihlášení. Čte se z databáze —
     * viz lib/billing/access.ts.
     */
    jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.isEmailVerified =
          Boolean((user as { emailVerified?: Date | null }).emailVerified) ||
          // Přihlášení přes Google pustí callback `signIn` dál jen
          // s adresou, kterou Google sám ověřil. Adaptér ale při zakládání
          // účtu tenhle údaj zahazuje a nastavuje ho natvrdo na prázdno,
          // takže by tu i po přihlášení Googlem vyšlo „neověřeno“ —
          // a uživatel by dostal výzvu, ať klikne na odkaz v e-mailu,
          // který mu nikdy nepřišel.
          account?.provider === "google";
      }

      // Po ověření e-mailu se token obnoví bez odhlášení.
      if (trigger === "update" && session) {
        if (typeof session.isEmailVerified === "boolean") {
          token.isEmailVerified = session.isEmailVerified;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
        // Kdy byl token vydán. Podle toho se pozná, jestli nebyl vydán
        // dřív, než si uživatel změnil heslo — viz lib/auth/session.ts.
        session.user.issuedAt = typeof token.iat === "number" ? token.iat : 0;
      }
      return session;
    },
  },
  // Poskytovatele doplňuje src/auth.ts — tady zůstává prázdné,
  // protože Credentials potřebuje databázi a ta v Edge runtimu není.
  providers: [],
} satisfies NextAuthConfig;
