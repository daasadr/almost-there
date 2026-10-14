import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { exportPKCS8, exportSPKI } from "jose";
import { LICENSE_DAYS, maskEmail, readOwnLicense, signLicense } from "./license";

/**
 * Testovací vektory z kontraktu, oddíl 9.
 *
 * Nejsou naše. Tytéž používají testy Vision Boardu (`cargo test`), takže
 * když projdou obě strany, je jisté, že si budou rozumět — a je to
 * jediná kontrola, která to ověří dřív, než se aplikace vydá a začne
 * licence vynucovat.
 *
 * Shoda se kontroluje znak po znaku, ne jen „podpis sedí". Pořadí claims
 * totiž rozhoduje o bajtech a tím o podpisu; kdyby se někdo rozhodl
 * přidat claim doprostřed, podepsalo by se něco jiného a tenhle test
 * je jediné místo, kde se to pozná.
 */

const SEED = "visionboard-test-key-do-not-use!";

function testKeyPair() {
  const der = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    Buffer.from(SEED),
  ]);
  const privateKey = crypto.createPrivateKey({
    key: der,
    format: "der",
    type: "pkcs8",
  });
  return { privateKey, publicKey: crypto.createPublicKey(privateKey) };
}

const EXPECTED =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtMSJ9." +
  "eyJpc3MiOiJodHRwczovL2FsbW9zdC10aGVyZS5ldSIsImF1ZCI6ImV1LmFsbW9zdC10aGVyZS52aXNpb25ib2FyZCIsInN1YiI6ImFjY3RfMTIzIiwiaWlkIjoiNmYxYzJhOGUtNGI3ZC00ZTNhLTljNTUtMmQ4ZjBiMWE3ZTQ0IiwiZmVhdHVyZXMiOlsicHJlbWl1bUZyYW1lcyIsIndhbGxwYXBlciIsInNjaGVkdWxlZFBvcHVwIl0sImxhYmVsIjoiaioqKkBleGFtcGxlLmNvbSIsInNyYyI6ImFjY291bnQiLCJqdGkiOiJsaWNfNDU2IiwiaWF0IjoxNzkxNzYzMjAwLCJleHAiOjE4MjMyOTkyMDB9." +
  "Xf1bJVk-CFD4WTstRyhQL3Lrwx9bBbu_t3tb_E0MkQQ1rwcJ9WEqw8L0TSqsbJcIlyvE0QIFAjXPfbVDQeuJAQ";

/** Vstupy, ze kterých ten vektor vznikl. */
const VECTOR = {
  userId: "acct_123",
  installationId: "6f1c2a8e-4b7d-4e3a-9c55-2d8f0b1a7e44",
  installationRecordId: "lic_456",
  email: "jana@example.com",
  src: "account" as const,
  issuedAt: 1791763200,
  kid: "test-1",
};

async function signWithTestKey(overrides: Partial<typeof VECTOR> = {}) {
  const { privateKey } = testKeyPair();
  const key = await crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(
      (await exportPKCS8(privateKey as unknown as CryptoKey))
        .replace(/-----[^-]+-----|\s/g, ""),
      "base64",
    ),
    { name: "Ed25519" },
    true,
    ["sign"],
  );
  return signLicense({ ...VECTOR, ...overrides, key });
}

describe("podepisování licencí", () => {
  it("vyrobí přesně ten token, který čeká kontrakt", async () => {
    expect(await signWithTestKey()).toBe(EXPECTED);
  });

  it("testovací klíč odpovídá veřejnému klíči z kontraktu", () => {
    const { publicKey } = testKeyPair();
    const jwk = publicKey.export({ format: "jwk" }) as { x: string };
    expect(jwk.x).toBe("HgpuyQVSnTH56tfOw1DSRtGsN3095zYe1lrY-cWBsWo");
  });

  it("platnost je rok od vydání", async () => {
    const token = await signWithTestKey();
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    expect(payload.exp - payload.iat).toBe(LICENSE_DAYS * 24 * 60 * 60);
  });

  it("hlavička říká EdDSA a nese kid", async () => {
    const token = await signWithTestKey();
    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64url").toString(),
    );
    expect(header).toEqual({ alg: "EdDSA", typ: "JWT", kid: "test-1" });
  });
});

describe("maskování e-mailu", () => {
  it("nechá první písmeno a doménu", () => {
    expect(maskEmail("jana@example.com")).toBe("j***@example.com");
  });

  it("zvládne adresu se zavináčem v názvu", () => {
    expect(maskEmail("a@b@example.com")).toBe("a***@example.com");
  });

  it("nepřeteče osmdesát znaků", () => {
    const long = `${"x".repeat(200)}@example.com`;
    expect(maskEmail(long).length).toBeLessThanOrEqual(80);
  });

  it("nespadne na textu, který e-mail není", () => {
    expect(maskEmail("bez zavinace")).toBe("bez zavinace");
  });
});

describe("čtení vlastní licence", () => {
  async function publicPem() {
    const { publicKey } = testKeyPair();
    return exportSPKI(publicKey as unknown as CryptoKey);
  }

  it("přečte claims z licence, kterou jsme vydali", async () => {
    const claims = await readOwnLicense(EXPECTED, await publicPem());
    expect(claims).toMatchObject({
      sub: "acct_123",
      iid: "6f1c2a8e-4b7d-4e3a-9c55-2d8f0b1a7e44",
      jti: "lic_456",
      src: "account",
    });
  });

  it("odmítne upravený payload", async () => {
    const [header, , signature] = EXPECTED.split(".");
    const tampered = Buffer.from(
      JSON.stringify({ iss: "https://almost-there.eu", sub: "acct_999" }),
    ).toString("base64url");

    expect(
      await readOwnLicense(`${header}.${tampered}.${signature}`, await publicPem()),
    ).toBeNull();
  });

  it("odmítne token bez podpisu", async () => {
    const payload = EXPECTED.split(".")[1];
    const none = Buffer.from(
      JSON.stringify({ alg: "none", typ: "JWT" }),
    ).toString("base64url");

    expect(await readOwnLicense(`${none}.${payload}.`, await publicPem())).toBeNull();
  });

  it("odmítne cizí podpis", async () => {
    const other = crypto.generateKeyPairSync("ed25519");
    const otherPem = await exportSPKI(other.publicKey as unknown as CryptoKey);

    expect(await readOwnLicense(EXPECTED, otherPem)).toBeNull();
  });

  it("odmítne nesmysl místo tokenu", async () => {
    expect(await readOwnLicense("tohle token není", await publicPem())).toBeNull();
  });

  /**
   * Prošlá licence se smí obnovit, ale jen do devadesáti dnů.
   *
   * Kontrakt, oddíl 3.2. Kdo aplikaci nespustil čtvrt roku, aktivuje
   * znovu; kdo ji nespustil měsíc, nemá kvůli tomu přijít o nic.
   * Hranice je jen v jednom čísle v `readOwnLicense` a bez téhle
   * dvojice testů by se její posunutí nepoznalo.
   */
  const DAY = 24 * 60 * 60;

  it("prošlá do devadesáti dnů se ještě přečte", async () => {
    const now = Math.floor(Date.now() / 1000);
    // Vydaná před 400 dny, platnost rok → prošlá 35 dní.
    const token = await signWithTestKey({ issuedAt: now - 400 * DAY });

    expect(await readOwnLicense(token, await publicPem())).not.toBeNull();
  });

  it("prošlá déle než devadesát dnů se odmítne", async () => {
    const now = Math.floor(Date.now() / 1000);
    // Vydaná před 500 dny → prošlá 135 dní.
    const token = await signWithTestKey({ issuedAt: now - 500 * DAY });

    expect(await readOwnLicense(token, await publicPem())).toBeNull();
  });
});
