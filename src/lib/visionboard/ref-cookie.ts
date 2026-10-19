/**
 * Cookie s kódem pozvánky — jen název, platnost a tvar kódu.
 *
 * Vlastní soubor kvůli middlewaru. Ten běží v Edge runtimu, kde Prisma
 * nefunguje, takže si nemůže načíst `invite.ts`. Kdyby si to pravidlo
 * opsal k sobě, rozejdou se obě kopie při první změně.
 */

export const REF_COOKIE = "vb_ref";

/** Třicet dní. Pozvánka se často otevře, odloží a vyřídí jindy. */
export const REF_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Co vůbec může být kód pozvánky: base64url, rozumně dlouhý. */
export function isRefCode(value: string | null | undefined): value is string {
  return !!value && /^[A-Za-z0-9_-]{8,40}$/.test(value);
}
