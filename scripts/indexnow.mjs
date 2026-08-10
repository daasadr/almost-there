import { readdirSync, readFileSync } from "node:fs";

/**
 * Ohlášení nových a změněných stránek přes IndexNow.
 *
 * Běžně vyhledávač čeká, až sám někdy přijde. IndexNow je opačný směr:
 * my mu řekneme, že se něco změnilo, a on přijde hned. Jedno oznámení
 * se rozešle všem, kdo se toho účastní — Bing, Seznam.cz, Yandex,
 * Naver. Google součástí není, ten má vlastní Search Console.
 *
 * Bing je z toho pro nás nejdůležitější, protože z jeho výsledků čerpá
 * ChatGPT. Seznam.cz zase proto, že produkt míří hlavně na Česko.
 *
 * Ověření vlastnictví: soubor public/<klíč>.txt obsahuje ten samý klíč.
 * Vyhledávač si ho stáhne a tím ví, že oznámení může poslat jen ten, kdo
 * na web může nahrávat soubory. Není to tajemství — nejhorší, co s ním
 * někdo cizí zmůže, je ohlásit naše vlastní stránky.
 *
 * Spouští se ručně po nasazení: `npm run indexnow`. Automaticky ne —
 * ohlašovat totéž při každém nasazení je zbytečné a vyhledávače to
 * berou jako hluk.
 */

const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://almost-there.eu";
const host = new URL(SITE).host;

/** Klíč se hledá tam, kde stejně musí ležet — mezi veřejnými soubory. */
function findKey() {
  const match = readdirSync("public").find((name) =>
    /^[0-9a-f]{16,128}\.txt$/.test(name),
  );
  if (!match) {
    throw new Error(
      "V public/ není soubor s klíčem pro IndexNow. Vyrob ho: náhodných 32 znaků [0-9a-f], stejný obsah jako název (bez .txt).",
    );
  }

  const key = match.replace(/\.txt$/, "");
  const content = readFileSync(`public/${match}`, "utf8").trim();
  if (content !== key) {
    throw new Error(
      `Soubor public/${match} musí obsahovat přesně ${key}, jinak ověření neprojde.`,
    );
  }
  return key;
}

/** Seznam stránek se bere z živé mapy webu, ne z kódu — ohlašujeme to,
 *  co je opravdu venku. */
async function sitemapUrls() {
  const response = await fetch(`${SITE}/sitemap.xml`);
  if (!response.ok) {
    throw new Error(`Mapa webu vrátila ${response.status}. Je nasazeno?`);
  }
  const xml = await response.text();
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

const key = findKey();
const urlList = await sitemapUrls();

console.log(`Ohlašuji ${urlList.length} adres pro ${host}`);

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key,
    keyLocation: `${SITE}/${key}.txt`,
    urlList,
  }),
});

// 200 i 202 znamenají přijato; 202 jen dodává, že se klíč teprve ověří.
if (response.ok) {
  console.log(`Přijato (${response.status}).`);
} else {
  console.error(`Odmítnuto (${response.status}): ${await response.text()}`);
  process.exitCode = 1;
}
