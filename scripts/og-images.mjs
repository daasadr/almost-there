import sharp from "sharp";
import { readFileSync } from "node:fs";

/**
 * Náhledové obrázky pro sdílení odkazu.
 *
 * Když někdo pošle odkaz na web do zprávy, na sociální síť nebo když ho
 * ocituje odpověď jazykového modelu, ukáže se u něj tenhle obrázek. Bez
 * něj se ukáže prázdné místo nebo náhodný výřez stránky.
 *
 * Generuje se ručně příkazem `npm run og`, ne při každém buildu — je to
 * pomalé a obsah se mění jednou za čas. Když se změní texty níž, spusť
 * to znovu a výsledek commitni.
 *
 * Řádky se lámou natvrdo. Automatické lámání by tu znamenalo počítat
 * šířku textu podle písma a to za tu jednu stránku nestojí.
 */

const WIDTH = 1200;
const HEIGHT = 630;

const CONTENT = {
  cs: {
    headline: ["Už tam skoro jsi.", "Každý jednotlivý den."],
    sub: [
      "AI rozfázuje tvůj cíl na měsíce, týdny",
      "a dnešní checklist, který se dá odškrtat.",
    ],
  },
  en: {
    headline: ["You are almost there.", "Every single day."],
    sub: [
      "AI breaks your goal into months, weeks",
      "and a checklist you can tick off today.",
    ],
  },
  de: {
    headline: ["Du bist fast am Ziel.", "An jedem einzelnen Tag."],
    sub: [
      "KI zerlegt dein Ziel in Monate, Wochen",
      "und eine Liste, die du heute abhaken kannst.",
    ],
  },
};

/** Značka jako cesty — stejný tvar jako components/Logo.tsx. */
const logo = `
  <g transform="translate(80, 74) scale(2.0)" stroke="url(#brand)" stroke-width="2.1"
     stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M16 30V17"/><path d="M16 17 8.5 10.5"/><path d="M16 17 23.5 10.5"/>
    <path d="M8.5 10.5 5 5.5"/><path d="M8.5 10.5 12 5.5"/>
    <path d="M23.5 10.5 20 5.5"/><path d="M23.5 10.5 27 5.5"/>
  </g>
  <g transform="translate(80, 74) scale(2.0)" fill="#bef264">
    <circle cx="5" cy="4.6" r="1.7"/><circle cx="12" cy="4.6" r="1.7"/>
    <circle cx="20" cy="4.6" r="1.7"/>
  </g>
  <circle cx="134" cy="83.2" r="3.4" fill="#c4b5fd"/>
`;

function card({ headline, sub }) {
  const escape = (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="brand" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="60%" stop-color="#bef264"/>
      <stop offset="100%" stop-color="#c4b5fd"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.1" r="0.7">
      <stop offset="0%" stop-color="#a3e635" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#a3e635" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="#04100c"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>

  ${logo}
  <text x="152" y="119" font-family="Segoe UI, Helvetica, sans-serif" font-size="34"
        font-weight="600" fill="#e8f0ea">AlmostThere</text>

  <text x="80" y="290" font-family="Segoe UI, Helvetica, sans-serif" font-size="68"
        font-weight="700" fill="#e8f0ea">${escape(headline[0])}</text>
  <text x="80" y="372" font-family="Segoe UI, Helvetica, sans-serif" font-size="68"
        font-weight="700" fill="url(#brand)">${escape(headline[1])}</text>

  <text x="80" y="452" font-family="Segoe UI, Helvetica, sans-serif" font-size="27"
        fill="#9db3a5">${escape(sub[0])}</text>
  <text x="80" y="492" font-family="Segoe UI, Helvetica, sans-serif" font-size="27"
        fill="#9db3a5">${escape(sub[1])}</text>

  <rect x="80" y="548" width="76" height="3" rx="1.5" fill="url(#brand)"/>
  <text x="80" y="590" font-family="Segoe UI, Helvetica, sans-serif" font-size="24"
        fill="#6f8579">almost-there.eu</text>
</svg>`;
}

for (const [locale, content] of Object.entries(CONTENT)) {
  const file = `public/og-${locale}.png`;
  await sharp(Buffer.from(card(content))).png().toFile(file);
  console.log(file);
}

// Pojistka: kdyby v systému chybělo písmo, vyšel by z toho jen tmavý
// obdélník. Rozdíl v jasu to pozná dřív, než se obrázek dostane na web.
const stats = await sharp(readFileSync("public/og-cs.png")).stats();
if (stats.channels[0].mean < 6) {
  throw new Error(
    "Obrázek vypadá prázdný — nejspíš se nevykreslil text. Zkontroluj, že je v systému dostupné písmo Segoe UI nebo jiné z uvedených.",
  );
}
console.log("text vykreslen ✓");
