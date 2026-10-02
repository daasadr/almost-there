import QRCode from "qrcode";

/**
 * Sdílení QR kódem.
 *
 * K čemu to je: ukázat na obrazovce něco, co si druhý člověk naskenuje
 * telefonem. Posílat odkaz přes aplikaci je snazší, ale tohle funguje
 * tam, kde se lidé potkají — u stolu, na přednášce, u stánku. A dá se
 * to vytisknout.
 *
 * ── Bez jediného řádku kódu v prohlížeči ────────────────────────────
 *
 * Kód se vykreslí na serveru a schová do `details`, což je rozbalovací
 * prvek, který umí prohlížeč sám. Žádný skript, žádné čekání, funguje
 * i s klávesnicí a čtečkou obrazovky. Knihovna na QR zůstává na serveru
 * a do prohlížeče se neposílá.
 *
 * ── Proč je kód vždycky černobílý ───────────────────────────────────
 *
 * Obarvit ho podle motivu by bylo hezké a nefungovalo by. Čtečka
 * potřebuje ostrý kontrast a u světlých motivů by z barev vyšel kód,
 * který telefon nepřečte. Je to nástroj, ne ozdoba — a nepřečtený QR
 * kód není ozdoba ani náhodou.
 */

export async function QrShare({
  url,
  label,
  hint,
}: {
  url: string;
  label: string;
  /** Adresa pod kódem, ať jde opsat i bez telefonu. */
  hint?: string;
}) {
  /*
   * `create` vrátí samotnou mřížku, ne hotový obrázek. Kreslí se z ní
   * vlastní SVG, takže se vyhneme vkládání cizího HTML do stránky
   * a zároveň se dá velikost ovládat stylem, ne pevnými pixely.
   */
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;

  // Jedna cesta pro celý kód místo tisíce obdélníků — stránka pak nemá
  // v sobě tisíc uzlů, které nikdo nepotřebuje procházet.
  let path = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y * size + x]) path += `M${x} ${y}h1v1h-1z`;
    }
  }

  // Okraj kolem kódu je součást normy, bez něj ho čtečky hledají hůř.
  const quiet = 2;
  const box = size + quiet * 2;

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm text-[var(--color-paper-faint)] transition hover:text-[var(--color-paper)]">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-4 w-4 fill-none stroke-current stroke-[1.6]"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM19 19h2v2h-2z" />
        </svg>
        {label}
      </summary>

      <div className="mt-3 inline-block rounded-xl bg-white p-3">
        <svg
          viewBox={`0 0 ${box} ${box}`}
          role="img"
          aria-label={label}
          className="h-40 w-40"
          shapeRendering="crispEdges"
        >
          <path d={path} transform={`translate(${quiet} ${quiet})`} fill="#111" />
        </svg>
      </div>

      {hint && (
        <p className="mt-2 break-all text-xs text-[var(--color-paper-faint)]">
          {hint}
        </p>
      )}
    </details>
  );
}
