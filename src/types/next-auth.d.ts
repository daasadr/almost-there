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
      /** NONE | TRIAL | ACTIVE | PAST_DUE | CANCELED */
      subscriptionStatus: string;
    } & DefaultSession["user"];
  }

  interface User {
    emailVerified?: Date | null;
    subscriptionStatus?: string;
    authProvider?: "CREDENTIALS" | "GOOGLE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isEmailVerified: boolean;
    subscriptionStatus: string;
  }
}
