/**
 * Kontrola nastavení Stripu před ostrým provozem.
 *
 * Přechod z testovacích klíčů na ostré je místo, kde se dá tiše ztratit
 * spousta peněz. Klíč, ID ceny i podpis webhooku existují v obou režimech
 * zvlášť a vypadají skoro stejně; když se prohodí, nic nespadne. Zákazník
 * jen zaplatí do prázdna, nebo se pokladna vůbec neotevře, a přijde se
 * na to podle chybějících plateb.
 *
 * Spouští se ručně po výměně klíčů, na serveru:
 *
 *   docker compose run --rm migrate npx tsx scripts/stripe-check.ts
 *
 * nebo lokálně:
 *
 *   npm run stripe:check
 */
import Stripe from "stripe";

const problems: string[] = [];
const notes: string[] = [];

function fail(message: string) {
  problems.push(message);
}

const secret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const monthlyId = process.env.STRIPE_PRICE_MONTHLY;
const yearlyId = process.env.STRIPE_PRICE_YEARLY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

if (!secret) throw new Error("Chybí STRIPE_SECRET_KEY.");
if (!monthlyId || !yearlyId) {
  throw new Error("Chybí STRIPE_PRICE_MONTHLY nebo STRIPE_PRICE_YEARLY.");
}

const keyIsLive = secret.startsWith("sk_live_");
const looksLikeProduction =
  appUrl.startsWith("https://") && !appUrl.includes("localhost");

console.log(`Klíč:      ${keyIsLive ? "OSTRÝ (sk_live_)" : "testovací (sk_test_)"}`);
console.log(`Adresa:    ${appUrl || "(nenastavena)"}`);
console.log("");

// Ostrá adresa s testovacím klíčem je ta nejdražší kombinace: zákazník
// projde pokladnou, ale peníze nikam nedojdou.
if (looksLikeProduction && !keyIsLive) {
  fail(
    "Ostrá adresa běží na TESTOVACÍCH klíčích. Zákazník projde pokladnou, ale nezaplatí — peníze nikam nedojdou.",
  );
}
if (!looksLikeProduction && keyIsLive) {
  fail(
    "Vývojová adresa běží na OSTRÝCH klíčích. Každý pokus o platbu při ladění strhne skutečné peníze.",
  );
}

if (!webhookSecret) {
  fail(
    "Chybí STRIPE_WEBHOOK_SECRET. Bez něj se nepotvrdí žádná platba — zákazník zaplatí a přístup nedostane.",
  );
} else if (!webhookSecret.startsWith("whsec_")) {
  fail("STRIPE_WEBHOOK_SECRET nezačíná na whsec_ — nejspíš je to jiná hodnota.");
}

const stripe = new Stripe(secret);

/**
 * Ceny. ID z testovacího a ostrého režimu vypadají stejně a rozezná je
 * až Stripe — proto se na ně ptáme, místo abychom hádali z názvu.
 */
async function checkPrice(label: string, id: string, expected: number) {
  let price: Stripe.Price;
  try {
    price = await stripe.prices.retrieve(id, { expand: ["product"] });
  } catch {
    fail(
      `Cenu ${label} (${id}) Stripe nezná. Nejspíš je to ID z druhého režimu — testovací a ostrý mají svoje.`,
    );
    return;
  }

  if (price.livemode !== keyIsLive) {
    fail(
      `Cena ${label} patří do ${price.livemode ? "ostrého" : "testovacího"} režimu, ale klíč je ${keyIsLive ? "ostrý" : "testovací"}. Pokladna se neotevře.`,
    );
    return;
  }

  if (!price.active) {
    fail(`Cena ${label} je ve Stripu vypnutá (archivovaná).`);
  }

  if (price.type !== "recurring") {
    fail(`Cena ${label} není opakovaná — předplatné by z ní nešlo založit.`);
  }

  // Zobrazovaná částka se musí shodovat s účtovanou. Není to kosmetika,
  // ale požadavek na transparentnost ceny.
  const amount = (price.unit_amount ?? 0) / 100;
  if (amount !== expected) {
    fail(
      `Cena ${label} je ve Stripu ${amount} ${price.currency?.toUpperCase()}, ale na webu ukazujeme ${expected} CZK.`,
    );
  }
  if (price.currency?.toLowerCase() !== "czk") {
    fail(`Cena ${label} je v měně ${price.currency}, čekáme CZK.`);
  }

  const interval = price.recurring?.interval;
  notes.push(
    `${label}: ${amount} ${price.currency?.toUpperCase()} / ${interval}, ${price.livemode ? "ostrá" : "testovací"}`,
  );
}

async function main() {
  await checkPrice("měsíční", monthlyId!, 179);
  await checkPrice("roční", yearlyId!, 1790);

  // Webhook musí ve Stripu existovat a mířit na naši adresu, jinak
  // podpisové tajemství nemá co ověřovat.
  if (looksLikeProduction) {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
    const expected = `${appUrl.replace(/\/+$/, "")}/api/stripe/webhook`;
    const match = endpoints.data.find((e) => e.url === expected);

    if (!match) {
      fail(
        `Ve Stripu není webhook mířící na ${expected}. Bez něj se platba nikdy nepotvrdí.`,
      );
    } else if (match.status !== "enabled") {
      fail(`Webhook na ${expected} je vypnutý (${match.status}).`);
    } else {
      notes.push(`Webhook: ${expected} — zapnutý`);
    }
  }

  for (const note of notes) console.log(`  ${note}`);
  console.log("");

  if (problems.length === 0) {
    console.log("Nastavení Stripu je v pořádku.");
    return;
  }

  console.error(`Nalezeno ${problems.length} problémů:\n`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exitCode = 1;
}

main();
