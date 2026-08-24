import "server-only";
import { createHash } from "node:crypto";

/**
 * Kontrola, jestli heslo někdo nezná.
 *
 * Schválně se nepřidávají pravidla na velká písmena a číslice. Vedou
 * k heslům typu „Heslo123!", která jsou pro útočníka snazší než delší
 * fráze, a lidé si je pak zapisují na papírek — to samé říká komentář
 * u délky ve validation.ts a doporučení NIST.
 *
 * Skutečné riziko je jinde: útočník nezkouší náhodné kombinace, zkouší
 * hesla, která už někde unikla. „helloworld" má deset znaků, takže na
 * délku projde, ale je v každém takovém seznamu.
 *
 * Kontroluje se proto trojí:
 *
 *  1. Heslo nesmí být složené z adresy uživatele nebo z názvu služby —
 *     to je první, co útočník zkusí, a žádný seznam k tomu nepotřebuje.
 *  2. Krátký seznam nejběžnějších hesel přímo tady. Nestojí nic a chytne
 *     to nejhorší i ve chvíli, kdy je síť mimo provoz.
 *  3. Databáze úniků Have I Been Pwned.
 */

/** Nejběžnější hesla. Krátký seznam — zbytek řeší databáze úniků. */
const COMMON = new Set([
  "helloworld",
  "password",
  "password1",
  "password123",
  "passw0rd",
  "qwertyuiop",
  "1234567890",
  "12345678910",
  "iloveyou",
  "letmein123",
  "admin12345",
  "welcome123",
  "abc12345678",
  "heslo12345",
  "nazdarsvete",
  "tajneheslo",
]);

export type PasswordProblem = "tooCommon" | "tooPersonal";

/**
 * Zeptá se databáze úniků, jestli heslo zná — aniž by ho poslala.
 *
 * Posílá se prvních pět znaků otisku SHA-1 a zpátky přijde seznam
 * konců všech otisků, které tou pěticí začínají. Porovnání proběhne
 * u nás. Služba se tak nikdy nedozví, na které heslo jsme se ptali,
 * ani od koho.
 *
 * Když se nedovoláme, heslo projde. Nedostupná cizí služba nesmí
 * uživateli zabránit v registraci — je to zpřísnění navíc, ne brána.
 */
async function isBreached(password: string): Promise<boolean> {
  const hash = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: { "Add-Padding": "true" },
        signal: AbortSignal.timeout(2500),
      },
    );
    if (!response.ok) return false;

    const body = await response.text();
    return body
      .split("\n")
      .some((line) => line.split(":")[0]?.trim() === suffix);
  } catch {
    return false;
  }
}

/** Vrací důvod, proč heslo nepřijmout — nebo `null`, když je v pořádku. */
export async function findPasswordProblem(
  password: string,
  email: string,
): Promise<PasswordProblem | null> {
  const normalised = password.toLowerCase().trim();

  if (COMMON.has(normalised)) return "tooCommon";

  // Část adresy před zavináčem a název služby. Kratší než pět znaků se
  // neřeší — u „jan@..." by se jinak zamítlo každé heslo se slovem „jan".
  const localPart = email.split("@")[0]?.toLowerCase() ?? "";
  const forbidden = [localPart, "almostthere", "almost-there"].filter(
    (part) => part.length >= 5,
  );

  if (forbidden.some((part) => normalised.includes(part))) {
    return "tooPersonal";
  }

  if (await isBreached(password)) return "tooCommon";

  return null;
}
