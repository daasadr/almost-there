/**
 * Nejnovější vydání Vision Boardu z GitHubu.
 *
 * Aplikace se vydává přes GitHub Releases veřejného repozitáře
 * `daasadr/vision-board` a aktualizuje se odtamtud sama. Web o tom
 * potřebuje jedinou věc: odkaz na instalátor, který se dá dát člověku,
 * co aplikaci ještě nemá.
 *
 * ── Proč ne natvrdo ────────────────────────────────────────────────
 *
 * Název souboru nese číslo verze (`Vision.Board_0.2.1_x64-setup.exe`),
 * takže napsat ho do kódu znamená, že po každém vydání vede odkaz na
 * neexistující soubor. Hledá se proto podle konce názvu.
 *
 * ── Proč ne `latest.json` ──────────────────────────────────────────
 *
 * Ten soubor je pro aktualizátor uvnitř aplikace a adresa v něm míří
 * do GitHub API s hlavičkou `Accept: application/octet-stream`. Do
 * prohlížeče se nehodí — viz kontrakt, oddíl 7.
 */

const REPO = "daasadr/vision-board";

/** Stálý odkaz, který funguje i když API neodpoví. */
export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;

/**
 * Hodina.
 *
 * Veřejné GitHub API pustí šedesát dotazů za hodinu z jedné adresy.
 * Bez cache by stačilo šedesát návštěv stránky a začalo by odmítat —
 * a vydání se stejně nekoná častěji než jednou za pár dní.
 */
const CACHE_SECONDS = 3600;

/** Podle konce názvu souboru se pozná, pro co instalátor je. */
const PLATFORMS: { suffix: string; platform: Platform }[] = [
  { suffix: "_x64-setup.exe", platform: "windows" },
  { suffix: ".dmg", platform: "macos" },
  { suffix: ".AppImage", platform: "linux" },
  { suffix: ".deb", platform: "linux" },
];

export type Platform = "windows" | "macos" | "linux";

export type Download = {
  platform: Platform;
  url: string;
  sizeMb: number;
};

export type Release = {
  version: string;
  publishedAt: string | null;
  downloads: Download[];
};

type GithubAsset = { name?: unknown; browser_download_url?: unknown; size?: unknown };

/**
 * Co je ke stažení. Prázdno znamená „ptej se GitHubu sama".
 *
 * Nikdy nevyhodí výjimku: stránka ke stažení má vždycky nabídnout
 * aspoň stálý odkaz. Rozbitá stránka je horší než o klik delší cesta.
 */
export async function latestRelease(): Promise<Release | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: CACHE_SECONDS },
      },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as {
      tag_name?: unknown;
      published_at?: unknown;
      assets?: unknown;
    };

    const version =
      typeof data.tag_name === "string" ? data.tag_name.replace(/^v/, "") : null;
    if (!version) return null;

    const assets = Array.isArray(data.assets) ? (data.assets as GithubAsset[]) : [];
    const downloads: Download[] = [];

    for (const asset of assets) {
      const name = asset.name;
      const url = asset.browser_download_url;
      if (typeof name !== "string" || typeof url !== "string") continue;

      // `.exe.sig` je podpis aktualizace, ne instalátor. Vyřadí se sám,
      // protože nekončí na `_x64-setup.exe`.
      const match = PLATFORMS.find((p) => name.endsWith(p.suffix));
      if (!match) continue;

      downloads.push({
        platform: match.platform,
        url,
        sizeMb:
          typeof asset.size === "number"
            ? Math.round((asset.size / 1024 / 1024) * 10) / 10
            : 0,
      });
    }

    if (downloads.length === 0) return null;

    return {
      version,
      publishedAt:
        typeof data.published_at === "string" ? data.published_at : null,
      downloads,
    };
  } catch {
    // Výpadek sítě nebo GitHubu. Volající nabídne stálý odkaz.
    return null;
  }
}
