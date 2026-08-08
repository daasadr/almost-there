import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Ukládání nahraných obrázků na disk.
 *
 * Soubory nejdou do databáze — obrázky jsou velké a databázi by to
 * nafouklo tak, že by se přestala rozumně zálohovat. Leží ve svazku
 * vedle kontejneru; ten musí být v zálohách zvlášť.
 *
 * Každý obrázek se převede na webp. Není to jen kvůli velikosti:
 * překódováním se zahodí metadata, tedy i GPS souřadnice, které si
 * fotky z telefonu nesou. Nahrát motivační fotku z dovolené nemá
 * znamenat, že nám uživatel odevzdá, kde byl.
 */

/** Delší strana výsledku. Přes celou šířku karty víc není potřeba. */
const MAX_DIMENSION = 1600;
/** Horní mez pro přijatý soubor. Nad tím jde nejspíš o omyl. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
/** Kolik obrázků smí být u jednoho cíle. */
export const MAX_IMAGES_PER_GOAL = 30;

/**
 * Kořen úložiště. V produkci ho nastavuje compose, lokálně je to složka
 * `uploads` vedle projektu.
 *
 * Schválně bez `process.cwd()`: Next.js při sledování závislostí takový
 * zápis vyhodnotí tak, že modul může sáhnout kamkoliv, a do produkčního
 * balíčku pak obalí celý projekt. Relativní cesta si cwd doplní až
 * ve chvíli, kdy s ní pracuje `fs`.
 */
export function uploadsRoot(): string {
  return process.env.UPLOADS_DIR || "uploads";
}

function absolutePath(storageKey: string): string {
  const root = uploadsRoot();
  const full = path.resolve(root, storageKey);

  // Pojistka proti tomu, aby klíč z databáze ukázal mimo úložiště.
  // Dnes ho skládáme sami, ale tahle kontrola stojí jeden řádek.
  if (!full.startsWith(path.resolve(root) + path.sep)) {
    throw new Error("Neplatná cesta k souboru.");
  }
  return full;
}

export type StoredImage = {
  storageKey: string;
  width: number;
  height: number;
  byteSize: number;
};

/**
 * Zpracuje nahraný soubor a uloží ho. Vrací údaje pro databázi.
 * Když vstup není obrázek, sharp selže a chyba propadne volajícímu.
 */
export async function storeImage({
  goalId,
  imageId,
  input,
}: {
  goalId: string;
  imageId: string;
  input: Buffer;
}): Promise<StoredImage> {
  const processed = await sharp(input)
    .rotate() // podle EXIF, dokud ho ještě máme
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const storageKey = path.posix.join(goalId, `${imageId}.webp`);
  const target = absolutePath(storageKey);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, processed.data);

  return {
    storageKey,
    width: processed.info.width,
    height: processed.info.height,
    byteSize: processed.data.byteLength,
  };
}

export async function readImage(storageKey: string): Promise<Buffer> {
  return readFile(absolutePath(storageKey));
}

/** Smaže jeden soubor. Chybějící soubor není chyba — cíl je prázdno. */
export async function deleteImage(storageKey: string): Promise<void> {
  await rm(absolutePath(storageKey), { force: true });
}

/**
 * Smaže celou složku cíle. Volá se při smazání cíle — databázová kaskáda
 * odstraní záznamy, ale na disk nedosáhne a soubory by tam zůstaly ležet.
 */
export async function deleteGoalImages(goalId: string): Promise<void> {
  await rm(absolutePath(goalId), { recursive: true, force: true });
}
