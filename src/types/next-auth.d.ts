import type { DefaultSession } from "next-auth";

/**
 * Rozšíření typů NextAuth o pole, která si do session přidáváme.
 * Bez tohohle by `session.user.id` v TypeScriptu neexistovalo.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Zda má uživatel ověřenou e-mailovou adresu.
       *  Vlastní název — NextAuth má `emailVerified` jako Date. */
      isEmailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    emailVerified?: Date | null;
    authProvider?: "CREDENTIALS" | "GOOGLE";
  }
}

// Stav předplatného tu schválně není — mění ho webhook od Stripu mimo
// přihlášení, takže by v tokenu zastaral. Bere se z databáze.
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isEmailVerified: boolean;
  }
}
