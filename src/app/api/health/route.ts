import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
// Odpověď nesmí nikdo uložit do mezipaměti. Uložená odpověď „jsem zdravý"
// by hlídače uklidňovala ještě dlouho poté, co aplikace přestala fungovat.
export const dynamic = "force-dynamic";

/**
 * Jestli je aplikace schopná obsluhovat.
 *
 * Tohle je jediné místo, kterého se smí ptát hlídač dostupnosti, Docker
 * i budoucí přepínání verzí. Rozdíl proti ťuknutí na obyčejnou stránku je
 * v tom, že se ptá i databáze: Next.js umí naběhnout a vykreslit úvodní
 * stránku i ve chvíli, kdy je databáze pryč — takže „stránka odpověděla"
 * neznamená „aplikace funguje". Přihlášený uživatel by v takovém stavu
 * narazil na chybu u prvního kliknutí.
 *
 * Dotaz je schválně ten nejlevnější možný. Běží každých pár minut navždy,
 * takže nesmí nic číst z tabulek ani nic zapisovat.
 *
 * Bez přihlášení schválně — hlídač žádné heslo mít nemůže, a ven se
 * nepouští nic než ano/ne. Žádná verze, žádný text chyby: podrobnosti
 * o tom, co přesně je rozbité, patří do logu, ne do internetu.
 */
export async function GET() {
  const started = Date.now();

  try {
    await withTimeout(db.$queryRaw`SELECT 1`, 4000);
  } catch (error) {
    // Do logu detail patří — je vidět jen na serveru.
    console.error("[health] databáze neodpověděla:", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true, ms: Date.now() - started });
}

/**
 * Nedostupná databáze se často neprojeví chybou, ale tím, že dotaz visí.
 * Bez tohohle by viselo i ptaní se, hlídač by narazil na svůj vlastní
 * časový limit a nahlásil „nedostupné" bez rozlišení, co je špatně.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}
