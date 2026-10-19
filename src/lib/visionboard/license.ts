import "server-only";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { SignJWT, jwtVerify, importPKCS8, importSPKI, type JWTPayload } from "jose";

/**
 * Licence Vision Boardu.
 *
 * Vision Board je samostatná desktopová aplikace, kterou si uživatel
 * aktivuje účtem AlmostThere. Licence je podepsaný JWT, který si aplikace
 * uloží u sebe a ověří **offline** vestavěným veřejným klíčem — serveru
 * se po aktivaci neptá vůbec.
 *
 * Z toho plyne všechno podstatné:
 *
 *  - **Jednou vydanou licenci nelze odvolat.** Nemá se jak dozvědět, že
 *    se něco změnilo. Proto má roční platnost; to je jediná páka, která
 *    nám zbývá, a aplikace si ji sama obnoví 14 dní předem, takže
 *    uživatel o ní neví.
 *  - **Obsah je čitelný.** JWT se jen podepisuje, nešifruje. Nic, co by
 *    nemělo být vidět, do něj nepatří — proto `label` je maskovaný
 *    e-mail a `sub` je neprůhledné id, ne adresa.
 *
 * Tvar popisuje `docs/visionboard-api.md`, oddíl 4. Nemění se
 * jednostranně: tytéž claims čte Rust na druhé straně.
 */

/** Co licence odemyká. Kontrakt, oddíl 4 — mění se jen s oběma stranami. */
export const LICENSE_FEATURES = [
  "premiumFrames",
  "wallpaper",
  "scheduledPopup",
] as const;

const ISSUER = "https://almost-there.eu";
const AUDIENCE = "eu.almost-there.visionboard";

/** Rok. Delší by znamenal menší kontrolu, kratší zbytečné obnovy. */
export const LICENSE_DAYS = 365;

/**
 * Jak daleko do minulosti se smí obnovovat.
 *
 * Kontrakt, oddíl 3.2: i prošlá licence se dá obnovit, nejvýš 90 dní
 * zpětně. Kdo aplikaci nespustil čtvrt roku, aktivuje znovu — a kdo ji
 * nespustil týden, nemá kvůli tomu přijít o nic.
 */
export const RENEW_GRACE_DAYS = 90;

export type LicenseClaims = {
  /** Id účtu. Neprůhledné, nikdy ne e-mail. */
  sub: string;
  /** Instalace, pro kterou licence platí. */
  iid: string;
  /** Id záznamu instalace u nás — `jti` licence. */
  jti: string;
  /** Co aplikace ukáže jako účet. Maskovaný e-mail. */
  label: string;
  /** `account` při běžné registraci, `invite` při registraci přes pozvánku. */
  src: "account" | "invite";
  iat: number;
  exp: number;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Chybí ${name}. Bez něj se licence Vision Boardu nedají podepisovat.`,
    );
  }
  return value;
}

/**
 * Klíče se načítají líně a drží se.
 *
 * Import PEM není zadarmo a běží při každém vydání licence. Načíst to
 * při startu modulu by zase znamenalo, že se aplikace bez nastavených
 * klíčů vůbec nespustí — a to je špatně: Vision Board je vedlejší věc
 * a nemá shazovat celý web.
 */
let keys: Promise<{ sign: CryptoKey; verify: CryptoKey }> | null = null;

/**
 * Klíč z proměnné prostředí převedený na PEM.
 *
 * PEM má tři řádky, jenže proměnná prostředí je v praxi jednořádková:
 * Docker Compose čte soubor `.env` řádek po řádku, takže by z klíče
 * zbyla hlavička a zbytek by zmizel. `createPrivateKey` by pak spadl
 * při prvním podpisu licence, ne při startu — tedy ve chvíli, kdy se
 * na to nikdo nedívá.
 *
 * Proto se bere obojí: buď PEM (s `\n` skutečnými nebo zapsanými jako
 * dva znaky), nebo celý PEM zakódovaný base64 na jeden řádek, což je
 * pro nasazení nejpohodlnější — `base64 -w0 klic.pem` a hotovo.
 */
export function toPem(value: string): string {
  const trimmed = value.trim();

  if (trimmed.includes("-----BEGIN")) {
    return trimmed.replace(/\\n/g, "\n");
  }

  return Buffer.from(trimmed, "base64").toString("utf8").trim();
}

/**
 * Veřejný klíč se **odvozuje** ze soukromého, neukládá se zvlášť.
 *
 * Dvě proměnné prostředí by znamenaly dvě věci, které se můžou rozejít —
 * a kdyby se rozešly, obnova licencí by tiše odmítala každou platnou.
 * Takovou poruchu nikdo nehledá na správném místě. Z páru Ed25519 se
 * veřejná část spočítá, takže není důvod ji mít dvakrát.
 */
function licenseKeys(): Promise<{ sign: CryptoKey; verify: CryptoKey }> {
  keys ??= (async () => {
    const pem = toPem(required("VISIONBOARD_LICENSE_PRIVATE_KEY"));
    const node = createPrivateKey(pem);
    const publicPem = createPublicKey(node)
      .export({ format: "pem", type: "spki" })
      .toString();

    return {
      sign: await importPKCS8(pem, "EdDSA"),
      verify: await importSPKI(publicPem, "EdDSA"),
    };
  })();

  return keys;
}

/** Jen pro testy: zapomene načtené klíče, ať jde prostředí prohodit. */
export function resetLicenseKeyCache(): void {
  keys = null;
}

/**
 * E-mail tak, jak ho uvidí uživatel v aplikaci.
 *
 * Celá adresa by v licenci neměla co dělat — token je čitelný a leží na
 * disku. Zároveň má být poznat, o který účet jde, když jich má člověk víc.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return email.slice(0, 80);

  const name = email.slice(0, at);
  const domain = email.slice(at);
  const masked = `${name[0]}***${domain}`;

  return masked.slice(0, 80);
}

/**
 * Podepíše licenci.
 *
 * **Pořadí claims není kosmetika.** `JSON.stringify` je zapíše tak, jak
 * byly vložené, takže jiné pořadí znamená jiné bajty a jiný podpis.
 * Testovací vektory z kontraktu by přestaly sedět a shoda s druhou
 * stranou by se přestala dát ověřit. Proto se celý objekt skládá tady
 * a nepoužívají se `setIssuer` a spol. — ty claims přidávají na konec.
 */
export async function signLicense({
  userId,
  installationId,
  installationRecordId,
  email,
  src,
  issuedAt = Math.floor(Date.now() / 1000),
  key,
  kid,
}: {
  userId: string;
  installationId: string;
  installationRecordId: string;
  email: string;
  src: "account" | "invite";
  /** Jen pro testy proti vektorům z kontraktu. */
  issuedAt?: number;
  key?: CryptoKey;
  kid?: string;
}): Promise<string> {
  const payload = {
    iss: ISSUER,
    aud: AUDIENCE,
    sub: userId,
    iid: installationId,
    features: [...LICENSE_FEATURES],
    label: maskEmail(email),
    src,
    jti: installationRecordId,
    iat: issuedAt,
    exp: issuedAt + LICENSE_DAYS * 24 * 60 * 60,
  };

  return new SignJWT(payload)
    .setProtectedHeader({
      alg: "EdDSA",
      typ: "JWT",
      kid: kid ?? required("VISIONBOARD_LICENSE_KID"),
    })
    .sign(key ?? (await licenseKeys()).sign);
}

/**
 * Ověří licenci, kterou jsme sami vydali.
 *
 * Používá se u obnovy a deaktivace: aplikace pošle svůj token a my z něj
 * potřebujeme vyčíst, komu a které instalaci patří. Podpis se kontroluje
 * veřejnou částí vlastního klíče — kdokoli jiný si token vymyslet nemůže.
 *
 * Prošlá licence projde, ale jen do `RENEW_GRACE_DAYS`. Proto se expirace
 * nekontroluje knihovnou (ta by ji odmítla rovnou), ale ručně níž.
 */
export async function readOwnLicense(
  token: string,
  publicKeyPem?: string,
): Promise<LicenseClaims | null> {
  try {
    const key = publicKeyPem
      ? await importSPKI(publicKeyPem, "EdDSA")
      : (await licenseKeys()).verify;

    const { payload } = await jwtVerify(token, key, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["EdDSA"],
      // Expiraci posoudíme sami — do 90 dní se smí obnovit.
      clockTolerance: RENEW_GRACE_DAYS * 24 * 60 * 60,
    });

    return asClaims(payload);
  } catch {
    // Cizí podpis, jiný algoritmus, zmršený tvar. Volající z toho udělá
    // `invalid_license`; rozlišovat mezi důvody by útočníkovi napovídalo.
    return null;
  }
}

function asClaims(payload: JWTPayload): LicenseClaims | null {
  const { sub, iid, jti, label, src, iat, exp } = payload as Record<
    string,
    unknown
  >;

  if (
    typeof sub !== "string" ||
    typeof iid !== "string" ||
    typeof jti !== "string" ||
    typeof label !== "string" ||
    (src !== "account" && src !== "invite") ||
    typeof iat !== "number" ||
    typeof exp !== "number"
  ) {
    return null;
  }

  return { sub, iid, jti, label, src, iat, exp };
}
