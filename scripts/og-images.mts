import sharp from "sharp";
import { readFileSync } from "node:fs";
import { templates } from "../src/content/templates/index";
import { locales, type Locale } from "../src/i18n/routing";

/**
 * Náhledové obrázky pro sdílení odkazu.
 *
 * Když někdo pošle odkaz na web do zprávy, na sociální síť nebo když ho
 * ocituje odpověď jazykového modelu, ukáže se u něj tenhle obrázek. Bez
 * něj se ukáže prázdné místo nebo náhodný výřez stránky.
 *
 * Generuje se ručně příkazem `npm run og`, ne při každém buildu — je to
 * pomalé a obsah se mění jednou za čas. Když se změní texty níž nebo
 * názvy šablon, spusť to znovu a výsledek commitni.
 *
 * ── Proč každá šablona vlastní ───────────────────────────────────────
 *
 * Šablony jsou to nejsdílenější, co web má: každá odpovídá na jednu
 * otázku, kterou si lidé kladou, a dá se poslat samostatně. Dokud měly
 * všechny tentýž obrázek, vypadal odkaz na maraton v chatu stejně jako
 * odkaz na kreslení — tedy jako reklama na aplikaci, ne jako ta věc,
 * kterou ten člověk zrovna řeší.
 *
 * Žádné fotky. Vzhled stránek je tmavý a typografický a fotka
 * usmívajícího se běžce by z nich udělala každou druhou aplikaci na
 * cíle; u hubnutí a u domova by navíc slibovala něco jiného, než co
 * plán dělá.
 *
 * ── Lámání řádků ─────────────────────────────────────────────────────
 *
 * Odhadem podle počtu znaků, ne měřením písma. U deseti názvů ve třech
 * jazycích se ručně lámat nedají a na přesnost na pixel tu nesejde —
 * když se řádek netrefí, je o pár znaků kratší, což nikdo nepozná.
 */

const WIDTH = 1200;
const HEIGHT = 630;

/** Kolik znaků se vejde na řádek titulku. Odhad, viz hlavička. */
const TITLE_CHARS = 34;

const CONTENT: Record<Locale, { headline: string[]; sub: string[] }> = {
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

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const FONT = "Segoe UI, Helvetica, sans-serif";

/** Hlavička obrázku: pozadí, záře, značka. Stejná na všech. */
function frame(body: string): string {
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
  <text x="152" y="119" font-family="${FONT}" font-size="34"
        font-weight="600" fill="#e8f0ea">AlmostThere</text>

${body}

  <rect x="80" y="548" width="76" height="3" rx="1.5" fill="url(#brand)"/>
  <text x="80" y="590" font-family="${FONT}" font-size="24"
        fill="#6f8579">almost-there.eu</text>
</svg>`;
}

/** Úvodní obrázek webu — dvě řádky titulku, dvě podtitulku. */
function homeCard({
  headline,
  sub,
}: {
  headline: string[];
  sub: string[];
}): string {
  return frame(`  <text x="80" y="290" font-family="${FONT}" font-size="68"
        font-weight="700" fill="#e8f0ea">${escape(headline[0])}</text>
  <text x="80" y="372" font-family="${FONT}" font-size="68"
        font-weight="700" fill="url(#brand)">${escape(headline[1])}</text>

  <text x="80" y="452" font-family="${FONT}" font-size="27"
        fill="#9db3a5">${escape(sub[0])}</text>
  <text x="80" y="492" font-family="${FONT}" font-size="27"
        fill="#9db3a5">${escape(sub[1])}</text>`);
}

/**
 * Rozláme text na řádky podle rozpočtu znaků.
 *
 * Nejvýš tři řádky; zbytek se zahodí a připojí výpustka. U názvů šablon
 * k tomu nedojde, ale obrázek s textem přes celou výšku by byl horší
 * než zkrácený název.
 */
function wrap(text: string, budget = TITLE_CHARS, max = 3): string[] {
  const lines: string[] = [];
  let current = "";

  for (const word of text.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= budget || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= max) return lines;
  return [...lines.slice(0, max - 1), `${lines[max - 1]}…`];
}

/**
 * Obrázek s nadpisem a popiskem pod ním.
 *
 * Titulek začíná na stejné výšce jako na úvodní kartě, takže jedna
 * sada obrázků drží pohromadě. Zkoušel jsem zarovnat ho naopak
 * spodním řádkem, aby popisek vycházel pokaždé stejně — jenže krátký
 * název pak visel u dolního okraje a nad ním zela díra.
 */
function titleCard({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note: string;
}): string {
  const lines = wrap(title);
  const firstBaseline = 290;
  const step = 72;

  const rendered = lines
    .map((line, index) => {
      const y = firstBaseline + index * step;
      // Poslední řádek v barvách značky — stejný trik jako na úvodní
      // stránce, ať je poznat, že je to tentýž web.
      const fill = index === lines.length - 1 ? "url(#brand)" : "#e8f0ea";
      return `  <text x="80" y="${y}" font-family="${FONT}" font-size="56"
        font-weight="700" fill="${fill}">${escape(line)}</text>`;
    })
    .join("\n");

  return frame(`  <text x="80" y="200" font-family="${FONT}" font-size="26"
        font-weight="600" fill="#9db3a5" letter-spacing="3">${escape(
          eyebrow.toUpperCase(),
        )}</text>

${rendered}

  <text x="80" y="${firstBaseline + lines.length * step - 12}"
        font-family="${FONT}" font-size="27"
        fill="#9db3a5">${escape(note)}</text>`);
}

type Messages = {
  templates: {
    title: string;
    areas: Record<string, string>;
    months: string;
  };
};

/** Názvy oblastí a tvar „N měsíců" se berou z překladů, ne odsud. */
function messagesFor(locale: Locale): Messages {
  return JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
}

/**
 * „{count, plural, ...}" vyřešený na jedno číslo.
 *
 * Plnou knihovnu na formátování zpráv tu kvůli třem jazykům zavádět
 * nemá cenu, ale opsat si ta slova sem by znamenalo, že se dřív nebo
 * později rozejdou s tím, co je v aplikaci.
 */
function plural(pattern: string, count: number): string {
  const body = pattern.match(/\{count,\s*plural,\s*(.*)\}$/s)?.[1] ?? "";
  const forms = new Map<string, string>();

  for (const match of body.matchAll(/(=?\w+)\s*\{([^{}]*)\}/g)) {
    forms.set(match[1], match[2]);
  }

  const key =
    forms.has(`=${count}`) ? `=${count}`
    : count === 1 ? "one"
    : count >= 2 && count <= 4 && forms.has("few") ? "few"
    : "other";

  return (forms.get(key) ?? forms.get("other") ?? "").replace("#", String(count));
}

const written: string[] = [];

async function write(file: string, svg: string): Promise<void> {
  await sharp(Buffer.from(svg)).png().toFile(`public/${file}`);
  written.push(file);
}

for (const locale of locales) {
  await write(`og-${locale}.png`, homeCard(CONTENT[locale]));

  const messages = messagesFor(locale);

  // Rozcestník. Popisek jsou názvy oblastí — říkají, co se vevnitř
  // najde, a nepotřebují k tomu vlastní překlad.
  await write(
    `og-templates-${locale}.png`,
    titleCard({
      eyebrow: "AlmostThere",
      title: messages.templates.title,
      note: Object.values(messages.templates.areas).join(" · "),
    }),
  );

  for (const template of templates) {
    await write(
      `og-template-${template.id}-${locale}.png`,
      titleCard({
        eyebrow: messages.templates.areas[template.area],
        title: template.text[locale].title,
        note: plural(messages.templates.months, template.defaultMonths),
      }),
    );
  }
}

console.log(`${written.length} obrázků`);

// Pojistka: kdyby v systému chybělo písmo, vyšel by z toho jen tmavý
// obdélník. Rozdíl v jasu to pozná dřív, než se obrázek dostane na web.
for (const file of ["og-cs.png", `og-template-${templates[0].id}-cs.png`]) {
  const stats = await sharp(readFileSync(`public/${file}`)).stats();
  if (stats.channels[0].mean < 6) {
    throw new Error(
      `${file} vypadá prázdný — nejspíš se nevykreslil text. Zkontroluj, že je v systému dostupné písmo Segoe UI nebo jiné z uvedených.`,
    );
  }
}
console.log("text vykreslen ✓");
