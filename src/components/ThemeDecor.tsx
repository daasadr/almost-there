/**
 * Ozdoby motivů.
 *
 * První pokus je maloval jako opakující se přechody v pozadí stránky
 * a nedopadl dobře: u Steampunku z koleček vznikla pravidelná mřížka,
 * přes kterou se špatně četlo, a u Jungle a Sweet nebylo vidět skoro
 * nic. Přechod přes celou plochu je totiž buď slabý, nebo překáží —
 * nic mezi tím.
 *
 * Tohle jsou proto konkrétní tvary na konkrétních místech: pár velkých
 * koleček u okrajů, měkké obláčky, listy v rozích. Uprostřed, kudy
 * běží text, není nic.
 *
 * Vykresluje se všechno a CSS pak ukáže jen to, co patří k zapnutému
 * motivu. Je to kus statického HTML navíc, zato bez jediného řádku
 * kódu v prohlížeči — a přepnutí motivu je tím okamžité.
 *
 * Celé to leží pod obsahem (`z-index: -1`) a neodchytává klepnutí.
 */
export function ThemeDecor() {
  return (
    <div aria-hidden="true" className="theme-decor">
      {/* --- Steampunk: ozubená kola u okrajů ------------------------- */}
      <div className="decor-steampunk">
        <Gear className="decor-gear decor-gear-a" teeth={12} />
        <Gear className="decor-gear decor-gear-b" teeth={9} />
        <Gear className="decor-gear decor-gear-c" teeth={14} />
      </div>

      {/* --- Sweet: obláčky ------------------------------------------- */}
      <div className="decor-sweet">
        <span className="decor-cloud decor-cloud-a" />
        <span className="decor-cloud decor-cloud-b" />
        <span className="decor-cloud decor-cloud-c" />
        <span className="decor-cloud decor-cloud-d" />
      </div>

      {/* --- Jungle: listy a prorostlá zeleň zdola -------------------- */}
      <div className="decor-jungle">
        <span className="decor-undergrowth" />
        <Leaf className="decor-leaf decor-leaf-a" />
        <Leaf className="decor-leaf decor-leaf-b" />
        <Leaf className="decor-leaf decor-leaf-c" />
      </div>
    </div>
  );
}

/**
 * Ozubené kolo.
 *
 * Zuby se počítají do kruhu, ne kreslí ručně — u čtrnácti zubů by to
 * byl nečitelný seznam souřadnic a změna počtu by znamenala přepsat
 * všechno.
 */
function Gear({ className, teeth }: { className: string; teeth: number }) {
  const outer = 50;
  const root = 40;
  const half = Math.PI / teeth / 2;

  const points: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const angle = (i * 2 * Math.PI) / teeth;
    for (const [radius, offset] of [
      [root, -half * 1.6],
      [outer, -half * 0.7],
      [outer, half * 0.7],
      [root, half * 1.6],
    ] as const) {
      const a = angle + offset;
      points.push(
        `${(50 + radius * Math.cos(a)).toFixed(2)},${(50 + radius * Math.sin(a)).toFixed(2)}`,
      );
    }
  }

  return (
    <svg viewBox="0 0 100 100" className={className}>
      <polygon points={points.join(" ")} />
      <circle cx="50" cy="50" r="16" className="decor-gear-hole" />
    </svg>
  );
}

/** Jednoduchý list — dva oblouky proti sobě a žilka. */
function Leaf({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <path d="M50 4C22 24 10 52 12 96 54 92 82 62 88 12 74 30 60 22 50 4Z" />
      <path
        d="M14 94C34 70 56 48 86 16"
        className="decor-leaf-vein"
        fill="none"
      />
    </svg>
  );
}
