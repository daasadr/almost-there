"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Vrátí na dnešek toho, kdo přišel na starou adresu s `?day=`.
 *
 * Listování po dnech mění adresu, takže v ní den zůstane viset. Prohlížeč
 * ale po zavření obnoví poslední záložky — a člověk, který se ráno přijde
 * podívat, co má dnes dělat, uvidí den, který si prohlížel večer. Hotové
 * úkoly, žádná dnešní myšlenka a nikde nic, co by naznačovalo, že se dívá
 * do minulosti. Odkaz „zpátky na dnešek" tam je, ale ten se musí nejdřív
 * všimnout, že je něco špatně.
 *
 * ── Jak se pozná „přišel" od „proklikal se" ─────────────────────────────
 *
 * Server to nepozná: oba případy vypadají jako požadavek na `?day=`.
 * Pozná se to ale v prohlížeči. Přechod uvnitř aplikace nezakládá nový
 * dokument, takže adresa, na které se dokument **načetl**, zůstává ta
 * původní. Když je v ní den, přišlo se sem zvenčí — ze záložky, z historie
 * nebo z obnovené relace. Když v ní den není, doklikal se sem a nemá se
 * mu v tom bránit.
 *
 * Kontroluje se jednou za dokument. Bez toho by se po návratu na dnešek
 * nedalo na tentýž den klepnout znovu: adresa načtení se nemění, takže
 * by ho to pokaždé vrátilo zpátky.
 */

/** Už se v tomhle dokumentu kontrolovalo? Přežívá odpojení komponenty. */
let checked = false;

export function TodayGuard({ locale, day }: { locale: string; day: string }) {
  const router = useRouter();

  useEffect(() => {
    if (checked) return;
    checked = true;

    const [entry] = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    // Když prohlížeč tenhle údaj nedá, je lepší nechat být, co uživatel
    // vidí, než ho odněkud odvádět na základě dohadu.
    if (!entry) return;

    const loadedAt = new URL(entry.name, window.location.origin);
    if (loadedAt.searchParams.get("day") !== day) return;

    // `replace`, ne `push`: tlačítko zpět má vést tam, odkud člověk
    // přišel, ne zpátky do včerejška.
    router.replace(`/${locale}/app`);
  }, [locale, day, router]);

  return null;
}
