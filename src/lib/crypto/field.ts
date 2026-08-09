import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * Šifrování textových polí v databázi.
 *
 * Co to chrání: ukradenou zálohu, prodaný disk, prolomený přístup
 * k databázi bez přístupu na server. To jsou zdaleka nejpravděpodobnější
 * způsoby, jak by se cizí člověk dostal k tomu, co si lidé předsevzali.
 *
 * Co to nechrání: provozovatele a nikoho, kdo se dostane na server —
 * klíč je tam. Tvrdit něco jiného by byla lež a v zásadách zpracování
 * to je napsané přesně takhle.
 *
 * Použitý je AES-256-GCM, tedy šifra s ověřením: kdo by v databázi
 * upravil jediný bajt, nedostane pozměněný text, ale chybu.
 */

const ALGORITHM = "aes-256-gcm";
/** Značka na začátku. Podle ní se pozná zašifrovaná hodnota od holé. */
const PREFIX = "enc:v1:";
const IV_BYTES = 12; // doporučená délka pro GCM

let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "Chybí ENCRYPTION_KEY. Vygeneruj klíč příkazem `openssl rand -base64 32` " +
        "a vlož ho do .env. Bez něj by se obsah cílů ukládal nezašifrovaný.",
    );
  }

  const parsed = Buffer.from(raw, "base64");
  if (parsed.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY musí mít po dekódování 32 bajtů, má ${parsed.length}. ` +
        "Vygeneruj ho příkazem `openssl rand -base64 32`.",
    );
  }

  cachedKey = parsed;
  return parsed;
}

/** Je hodnota už zašifrovaná? */
export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

/**
 * Zašifruje hodnotu. Šifruje se vždy, i když text sám začíná naší
 * značkou — kdybychom takový vstup přeskakovali, stačilo by napsat cíl
 * začínající „enc:v1:" a uložil by se nezašifrovaný.
 *
 * Ochranu proti dvojímu zašifrování potřebuje jen dávkový převod
 * existujících dat, a ten si ji dělá sám přes `isEncrypted`.
 */
export function encryptField(value: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  return [
    PREFIX + iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Rozšifrování. Hodnota bez značky se vrací beze změny — díky tomu
 * aplikace funguje i nad daty, která vznikla před zavedením šifrování,
 * a nasazení se nemusí lámat přes koleno.
 */
export function decryptField(value: string): string {
  if (!isEncrypted(value)) return value;

  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return value;

  const [ivPart, tagPart, dataPart] = parts;

  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      key(),
      Buffer.from(ivPart, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64"));

    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // Sem to spadne, když někdo data upravil nebo když se změnil klíč.
    // Vracet původní řetězec by uživateli ukázalo změť znaků, takže
    // radši křičíme — je to chyba provozu, ne stav, se kterým se počítá.
    throw new Error(
      "Zašifrovanou hodnotu se nepodařilo přečíst. Nesedí klíč, " +
        "nebo byla data v databázi změněna.",
    );
  }
}

/**
 * Ověření, že klíč v prostředí odpovídá tomu, kterým jsou data zašifrovaná.
 *
 * Volá se při startu zálohovacího a migračního skriptu — bez toho by se
 * nesprávný klíč projevil až tím, že aplikace přestane číst data.
 */
export function verifyKeyMatches(sample: string): boolean {
  try {
    const roundTrip = decryptField(encryptField(sample));
    return timingSafeEqual(Buffer.from(roundTrip), Buffer.from(sample));
  } catch {
    return false;
  }
}
