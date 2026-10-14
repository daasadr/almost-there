import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Aktivační kód pro Vision Board.
 *
 * Člověk potvrdí aktivaci na webu, dostane dvanáctimístný kód a ten
 * putuje do aplikace — buď sám odkazem `visionboard://`, nebo ho
 * uživatel opíše. Aplikace si s ním u nás vyzvedne licenci.
 *
 * ── Proč se kód smí ukázat na obrazovce ─────────────────────────────
 *
 * Protože sám o sobě nestačí. Aplikace si na začátku vymyslí tajemství
 * (`verifier`), pošle nám jen jeho otisk (`challenge`) a kód vymění za
 * licenci jen tehdy, když to tajemství doloží. Kdo kód opíše z cizí
 * obrazovky nebo vytáhne z historie prohlížeče, nemá s ním co dělat.
 * Je to PKCE, RFC 7636 — tentýž postup, jakým se přihlašují mobilní
 * aplikace.
 *
 * ── Co se ukládá ────────────────────────────────────────────────────
 *
 * Jen otisk kódu. Kdo by se dostal k databázi, nesmí umět aktivovat
 * cizím jménem. Kód sám existuje deset minut na obrazovce a v paměti
 * aplikace, nikde jinde.
 *
 * Tvar popisuje `docs/visionboard-api.md`, oddíly 2 a 8.
 */

/**
 * Abeceda bez znaků, které se pletou.
 *
 * Chybí I, L, O, U, nula a jednička. Kód se opisuje z obrazovky do
 * aplikace, často z telefonu na počítač — a „0 nebo O?" je přesně ten
 * druh zdržení, kvůli kterého lidi aktivaci vzdají. U zůstalo venku,
 * aby z kódu nemohlo vyjít nic, co se čte jako slovo.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

const CODE_LENGTH = 12;

/** Deset minut. Delší nic nepřináší, kratší nestihne pomalý opis. */
export const CODE_TTL_MS = 10 * 60 * 1000;

/** Délka `challenge`: base64url z SHA-256 bez výplně. */
const CHALLENGE_LENGTH = 43;

/**
 * Náhodný kód bez zkreslení.
 *
 * Nabízelo by se `bajt % 30`, jenže 256 není dělitelné třiceti —
 * prvních šestnáct znaků abecedy by padalo častěji než zbylých
 * čtrnáct. U kódu, který má být neuhodnutelný, se takové zkreslení
 * nenosí, i když je malé. Bajty nad hranicí se proto zahazují
 * a losuje se znovu.
 */
/** Bajty od téhle hodnoty výš se zahazují: 240 = 8 × 30. */
const BYTE_LIMIT = Math.floor(256 / ALPHABET.length) * ALPHABET.length;

/**
 * Převod bajtů na znaky, oddělený od zdroje náhody.
 *
 * Zvlášť kvůli testům. Zkreslení z `bajt % 30` se na hotových kódech dá
 * hledat jen statisticky — a takový test je buď slabý, nebo občas spadne
 * sám od sebe. Nad určenou řadou bajtů se to ověří přesně: tohle se
 * zahodí, tohle vyjde takhle.
 *
 * Vrací, co stihne; o dostatek bajtů se stará volající.
 */
export function codeFromBytes(bytes: Iterable<number>): string {
  let code = "";
  for (const byte of bytes) {
    if (byte >= BYTE_LIMIT) continue;
    code += ALPHABET[byte % ALPHABET.length];
    if (code.length === CODE_LENGTH) break;
  }
  return code;
}

export function generateCode(): string {
  let code = "";
  // Šestnáct bajtů ze 256 se zahazuje, takže dvanáct znaků z dvaceti
  // bajtů vyjde skoro vždycky napoprvé. Smyčka je pojistka, ne pravidlo.
  while (code.length < CODE_LENGTH) {
    code += codeFromBytes(randomBytes(20));
    code = code.slice(0, CODE_LENGTH);
  }
  return code;
}

/** `ABCDEFGHJKMN` → `ABCD-EFGH-JKMN`. Jen pro oči, nikam se neposílá. */
export function formatCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

/**
 * Kód tak, jak s ním umíme pracovat.
 *
 * Aplikace ho má posílat normalizovaný, ale spoléhat na to nejde —
 * uživatel ho může opsat s pomlčkami, mezerami i malými písmeny.
 * Všechno, co v abecedě není, odchází pryč.
 */
export function normalizeCode(input: string): string {
  return [...input.toUpperCase()].filter((c) => ALPHABET.includes(c)).join("");
}

/** Otisk, který jde do databáze. */
function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("base64url");
}

/** `challenge` z tajemství aplikace — tatáž operace jako na její straně. */
export function challengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Je `challenge` z adresy použitelný? Kontrakt, oddíl 8. */
export function isValidChallenge(value: string): boolean {
  return value.length === CHALLENGE_LENGTH && /^[A-Za-z0-9_-]+$/.test(value);
}

/**
 * Je `state` z adresy použitelný?
 *
 * Web s ním nic nedělá, jen ho vrátí zpátky — a právě proto se kontroluje.
 * Cokoliv neověřeného, co se vloží do přesměrování, je díra.
 */
export function isValidState(value: string): boolean {
  return value.length > 0 && value.length <= 64 && /^[A-Za-z0-9_-]+$/.test(value);
}

/**
 * Vydá kód pro přihlášeného uživatele.
 *
 * Vrací kód v otevřené podobě — zavolá se jednou, ukáže se na stránce
 * a tím končí. V databázi po něm zůstane jen otisk.
 */
export async function issueActivationCode({
  userId,
  challenge,
}: {
  userId: string;
  challenge: string;
}): Promise<string> {
  const code = generateCode();

  await db.visionBoardActivationCode.create({
    data: {
      userId,
      codeHash: hashCode(code),
      challenge,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  return code;
}

export type ConsumeResult =
  | { ok: true; userId: string }
  | { ok: false; error: "invalid_code" | "expired_code" };

/**
 * Uplatní kód a tím ho spotřebuje.
 *
 * **Kód se zneplatní i tehdy, když tajemství nesedí.** Bez toho by šlo
 * zkoušet `verifier` dokola proti jednomu zachycenému kódu; takhle má
 * útočník jediný pokus. Je to v kontraktu, oddíl 3.1, a je to ta
 * nejdůležitější věta celého tohohle souboru.
 *
 * Prošlý kód se pozná zvlášť, aby aplikace mohla říct „vypršel, začni
 * znovu" místo obecného „nesedí". Vypršení není chyba uživatele.
 */
export async function consumeActivationCode({
  code,
  verifier,
}: {
  code: string;
  verifier: string;
}): Promise<ConsumeResult> {
  const normalized = normalizeCode(code);
  if (normalized.length !== CODE_LENGTH) return { ok: false, error: "invalid_code" };

  const record = await db.visionBoardActivationCode.findUnique({
    where: { codeHash: hashCode(normalized) },
    select: { id: true, userId: true, challenge: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt) return { ok: false, error: "invalid_code" };

  // Spotřebuje se hned a za všech okolností — i když se níž ukáže, že
  // tajemství nesedí. Pořadí je schválně: nejdřív spálit, pak posuzovat.
  const claimed = await db.visionBoardActivationCode.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Nula znamená, že ho mezitím uplatnil někdo jiný. Dva požadavky se
  // stejným kódem si tím nemůžou oba sáhnout na licenci.
  if (claimed.count === 0) return { ok: false, error: "invalid_code" };

  if (record.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "expired_code" };
  }

  if (!sameSecret(challengeFor(verifier), record.challenge)) {
    return { ok: false, error: "invalid_code" };
  }

  return { ok: true, userId: record.userId };
}

/**
 * Porovnání, které netrvá různě dlouho podle toho, kde se liší.
 *
 * Nad jedním otiskem to útočníkovi nedá skoro nic, protože kód už je
 * spotřebovaný. Ale je to ten druh zvyku, který se vyplatí mít —
 * jednou se tahle funkce použije někde, kde na tom záležet bude.
 */
function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
