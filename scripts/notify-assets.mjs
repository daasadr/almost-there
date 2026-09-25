import sharp from "sharp";
import { mkdirSync } from "node:fs";

/**
 * Obrázky do oznámení, pro každý motiv zvlášť.
 *
 * Vzhled oznámení kreslí operační systém a stránka do něj nemá co mluvit —
 * žádné zaoblení, žádné okraje, žádné barvy. Jediné dvě plochy, které jsou
 * naše, jsou ikona a velký obrázek. Tady se kreslí, aby aspoň ty nesly
 * barvy motivu, který si uživatel zvolil.
 *
 * Ikona je schválně **na spád**, bez průhledného okraje: systém ji vykreslí
 * v pevné velikosti, takže jediné, čím se dá získat plocha, je vyplnit ji
 * celou. Kresba s odsazením vypadá v oznámení o třetinu menší.
 *
 * Motiv „almost there" je stoupající oblouk s tečkou kousek před koncem.
 * Drží se i na dvaačtyřiceti bodech, což je velikost, ve které to Android
 * ukáže ve stavovém řádku.
 *
 * Generuje se ručně příkazem `npm run notify:assets`, ne při buildu — je to
 * pomalé a mění se to jednou za čas. Výsledek se commituje.
 */

const OUT = "public/notify";

const ICON = 192;
const BANNER = { width: 1200, height: 600 };

/**
 * Barvy motivů. Musí sedět s `SWATCHES` v ThemeSwitcher.tsx a s definicemi
 * v globals.css — tady jsou znovu, protože skript běží mimo aplikaci
 * a načítat kvůli třem barvám celý CSS soubor by bylo horší.
 */
const THEMES = {
  classic: { paper: "#04100c", accent: "#bef264", ink: "#f2f7f4" },
  steampunk: { paper: "#f3ead8", accent: "#c08a2c", ink: "#2c2016" },
  "sweet-pink": { paper: "#fffaf8", accent: "#e05b83", ink: "#3a2530" },
  "sweet-blue": { paper: "#f9fcff", accent: "#3a92d1", ink: "#23303c" },
  jungle: { paper: "#f8f4e9", accent: "#4a9c3f", ink: "#1d2b1a" },
  minimalist: { paper: "#ffffff", accent: "#101010", ink: "#414141" },
};

/**
 * Ikona: plocha v barvě akcentu, na ní oblouk a tečka.
 *
 * Akcent jako podklad, ne jako kresba — barevná plocha je v seznamu
 * oznámení vidět na první pohled, tenká čára na tmavém pozadí ne.
 */
function iconSvg({ paper, accent }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON}" height="${ICON}" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="${accent}"/>
  <path d="M28 138 C 68 138, 96 104, 118 66"
        fill="none" stroke="${paper}" stroke-width="15" stroke-linecap="round" opacity="0.92"/>
  <circle cx="139" cy="46" r="20" fill="${paper}"/>
</svg>`;
}

/**
 * Velký obrázek do rozbaleného oznámení.
 *
 * Tady je podkladem papír motivu a akcent nese kresbu — plocha je velká
 * a celá v syté barvě by přebila text, který je pod ní.
 */
function bannerSvg({ paper, accent, ink }) {
  const { width: w, height: h } = BANNER;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${paper}"/>

  <!-- Vlny v barvě motivu. Tři vrstvy s klesající sytostí dávají hloubku
       bez přechodů, které by se v malém náhledu stejně ztratily. -->
  <path d="M0 ${h} L0 ${h * 0.72} C ${w * 0.2} ${h * 0.6}, ${w * 0.35} ${h * 0.86}, ${w * 0.56} ${h * 0.75}
           C ${w * 0.78} ${h * 0.63}, ${w * 0.9} ${h * 0.8}, ${w} ${h * 0.7} L${w} ${h} Z"
        fill="${accent}" opacity="0.14"/>
  <path d="M0 ${h} L0 ${h * 0.84} C ${w * 0.25} ${h * 0.74}, ${w * 0.42} ${h * 0.96}, ${w * 0.66} ${h * 0.86}
           C ${w * 0.85} ${h * 0.78}, ${w * 0.93} ${h * 0.9}, ${w} ${h * 0.85} L${w} ${h} Z"
        fill="${accent}" opacity="0.26"/>

  <!-- Táž stoupající cesta jako v ikoně, aby se to poznalo jako jedna věc. -->
  <path d="M ${w * 0.1} ${h * 0.68} C ${w * 0.3} ${h * 0.66}, ${w * 0.45} ${h * 0.48}, ${w * 0.6} ${h * 0.3}"
        fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
  <circle cx="${w * 0.66}" cy="${h * 0.24}" r="34" fill="${accent}"/>
  <circle cx="${w * 0.66}" cy="${h * 0.24}" r="58" fill="none" stroke="${accent}" stroke-width="5" opacity="0.4"/>
  <circle cx="${w * 0.66}" cy="${h * 0.24}" r="82" fill="none" stroke="${accent}" stroke-width="3" opacity="0.2"/>

  <rect x="0" y="${h - 10}" width="${w}" height="10" fill="${accent}" opacity="0.7"/>
  <rect x="0" y="0" width="${w}" height="0" fill="${ink}"/>
</svg>`;
}

mkdirSync(OUT, { recursive: true });

for (const [name, colors] of Object.entries(THEMES)) {
  await sharp(Buffer.from(iconSvg(colors)))
    .png()
    .toFile(`${OUT}/${name}-icon.png`);

  await sharp(Buffer.from(bannerSvg(colors)))
    .png()
    .toFile(`${OUT}/${name}-banner.png`);

  console.log(`${name}: ikona + obrázek`);
}

console.log(`\nHotovo — ${Object.keys(THEMES).length} motivů v ${OUT}/`);
