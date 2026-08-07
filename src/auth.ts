import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth/config";
import { loginSchema } from "@/lib/auth/validation";

/**
 * Plná konfigurace přihlašování. Importuj jen v Node runtimu —
 * middleware používá `src/lib/auth/config.ts`, který je bez databáze.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Google adresu ověřuje sám, takže účet přes něj je rovnou ověřený.
      allowDangerousEmailAccountLinking: false,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
          authProvider: "GOOGLE" as const,
        };
      },
    }),

    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Heslo", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        // Účet bez hesla vznikl přes Google. Neříkáme to nahlas —
        // odpověď musí být stejná jako u neexistujícího účtu, jinak
        // by šlo zjišťovat, které adresy jsou zaregistrované.
        if (!user?.passwordHash || user.deletedAt) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
          subscriptionStatus: user.subscriptionStatus,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Přihlášení přes Google nevyžaduje potvrzení adresy — Google ji ověřil
     * za nás a posílat vlastní potvrzovací e-mail by uživatele jen zdržovalo.
     *
     * Spoléháme se ale na to, co Google skutečně tvrdí. Když u účtu hlásí
     * neověřenou adresu (stává se to u některých firemních účtů), přihlášení
     * odmítneme — jinak by šlo cizí adresu obsadit účtem, který ji nevlastní.
     */
    signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      return profile?.email_verified === true;
    },
  },
  events: {
    /**
     * Adaptér vytvoří uživatele s výchozími hodnotami. Dorovnáme způsob
     * přihlášení, který adaptér nezná — ověření adresy už nastavuje
     * mapování v `profile()` výš.
     */
    async linkAccount({ user, account }) {
      if (account.provider !== "google" || !user.id) return;

      await db.user.update({
        where: { id: user.id },
        data: { authProvider: "GOOGLE" },
      });
    },
  },
});
