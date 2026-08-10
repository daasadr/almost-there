import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";

/**
 * Obrázky pro záznam v Google Play.
 *
 * Play chce ikonu 512×512 a takzvaný hlavní obrázek 1024×500. Obojí
 * v PNG a bez průhlednosti — průhledné pozadí obchod podloží bílou
 * a z tmavé značky se stane šmouha.
 *
 * Snímky obrazovky tenhle skript nedělá a dělat nemůže: musí být
 * z opravdové aplikace s opravdovým obsahem. Prázdná obrazovka je na
 * nich poznat na první pohled a odrazuje.
 *
 * Spouští se ručně: `npm run play:assets`. Výsledek je ve `store/`,
 * odkud se nahrává do Play Console.
 */

const OUT = "store";

/** Značka jako cesty — stejný tvar jako components/Logo.tsx. */
function logo(scale, x, y) {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" stroke="url(#brand)"
       stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M16 30V17"/><path d="M16 17 8.5 10.5"/><path d="M16 17 23.5 10.5"/>
      <path d="M8.5 10.5 5 5.5"/><path d="M8.5 10.5 12 5.5"/>
      <path d="M23.5 10.5 20 5.5"/><path d="M23.5 10.5 27 5.5"/>
    </g>
    <g transform="translate(${x}, ${y}) scale(${scale})" fill="#bef264">
      <circle cx="5" cy="4.6" r="1.7"/><circle cx="12" cy="4.6" r="1.7"/>
      <circle cx="20" cy="4.6" r="1.7"/>
      <circle cx="27" cy="4.6" r="1.7" fill="#c4b5fd"/>
    </g>`;
}

const defs = `
  <defs>
    <linearGradient id="brand" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="60%" stop-color="#bef264"/>
      <stop offset="100%" stop-color="#c4b5fd"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.8" cy="0.15" r="0.75">
      <stop offset="0%" stop-color="#a3e635" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#a3e635" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

await mkdir(OUT, { recursive: true });

/**
 * Ikona. Značka sedí v prostředních dvou třetinách — obchod ji kreslí
 * v různých tvarech a u okraje by ji ořízl.
 */
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  ${defs}
  <rect width="512" height="512" fill="#04100c"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  ${logo(9.5, 104, 100)}
</svg>`;

await sharp(Buffer.from(icon))
  // Bez alfy: Play průhlednost podloží bílou a tmavá značka by zmizela.
  .flatten({ background: "#04100c" })
  .png()
  .toFile(`${OUT}/icon-512.png`);
console.log(`${OUT}/icon-512.png`);

/** Hlavní obrázek nad záznamem. Text je malý — Play ho zmenšuje. */
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
  ${defs}
  <rect width="1024" height="500" fill="#04100c"/>
  <rect width="1024" height="500" fill="url(#glow)"/>
  ${logo(4.2, 92, 196)}
  <text x="248" y="252" font-family="Segoe UI, Helvetica, sans-serif" font-size="62"
        font-weight="700" fill="#e8f0ea">AlmostThere</text>
  <text x="250" y="306" font-family="Segoe UI, Helvetica, sans-serif" font-size="27"
        fill="#9db3a5">Z velkého cíle dnešní checklist.</text>
</svg>`;

await sharp(Buffer.from(feature))
  .flatten({ background: "#04100c" })
  .png()
  .toFile(`${OUT}/feature-1024x500.png`);
console.log(`${OUT}/feature-1024x500.png`);

// Pojistka proti chybějícímu písmu — jinak by z toho byl tmavý obdélník.
const stats = await sharp(readFileSync(`${OUT}/feature-1024x500.png`)).stats();
if (stats.channels[0].mean < 6) {
  throw new Error(
    "Hlavní obrázek vypadá prázdný — nejspíš se nevykreslil text. Zkontroluj dostupnost písma Segoe UI.",
  );
}
console.log("text vykreslen ✓");
