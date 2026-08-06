import { z } from "zod";

/**
 * Validace přihlašovacích a registračních formulářů.
 * Sdílená klientem i serverem — server ji spouští znovu, na klientskou
 * kontrolu se nikdy nespoléhá.
 *
 * Chybové klíče odpovídají `auth.errors.*` v překladech; server posílá
 * jen kód, nikdy hotový text.
 */

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 200;

export const emailSchema = z
  .string()
  .trim()
  .min(1)
  .max(254)
  .email()
  .transform((value) => value.toLowerCase());

/**
 * Délka místo skladby znaků. Vynucené velké písmeno a číslice vedou
 * k heslům typu "Heslo123!", která jsou pro útočníka snazší než delší
 * fráze — a lidé si je zapisují na papírek.
 */
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH)
  .max(MAX_PASSWORD_LENGTH);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: passwordSchema,
  /**
   * Souhlas s podmínkami a zpracováním údajů. Povinný — bez něj nelze
   * registraci dokončit (zadání, bod 13). Musí být přímo `true`,
   * ne jen „pravdivá hodnota“.
   */
  consent: z.literal(true),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type AuthErrorKey =
  | "nameRequired"
  | "emailInvalid"
  | "emailTaken"
  | "passwordTooShort"
  | "consentRequired"
  | "invalidCredentials"
  | "emailNotVerified"
  | "tokenInvalid"
  | "tokenExpired"
  | "rateLimited"
  | "generic";

/** Kontrola registračního formuláře na klientovi, aby chyby seděly. */
export function validateRegister(input: {
  name: string;
  email: string;
  password: string;
  consent: boolean;
}): AuthErrorKey | null {
  if (!input.name.trim()) return "nameRequired";
  if (!emailSchema.safeParse(input.email).success) return "emailInvalid";
  if (input.password.length < MIN_PASSWORD_LENGTH) return "passwordTooShort";
  if (!input.consent) return "consentRequired";
  return null;
}
