"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Hlídá, jestli mezitím nezačal nový den.
 *
 * Appka přidaná na plochu se otevírá ve vlastním okně bez adresního
 * řádku — a tedy bez tlačítka pro obnovení. Kdo ji večer nechá otevřenou
 * a ráno se k ní vrátí, uvidí včerejšek: odškrtané úkoly a hlášku, že má
 * hotovo. To je ta nejhorší možná zpráva na začátku dne, protože je
 * nepravdivá a člověk podle ní nemá co dělat.
 *
 * Kontroluje se ve dvou okamžicích, protože ani jeden sám nestačí:
 *
 *  - Když se okno vrátí do popředí. Pokrývá zavřený notebook a přepnutou
 *    appku, tedy naprostou většinu případů.
 *  - Časovačem o půlnoci. Pokrývá toho, kdo appku nechá otevřenou přes
 *    půlnoc a dívá se na ni — tam by se jinak nic nestalo, dokud by
 *    někam neklikl.
 *
 * Obnovuje se jen zobrazení ze serveru, ne celá stránka: uživatel
 * zůstane tam, kde byl, jen uvidí dnešek.
 *
 * Když si někdo prohlíží jiný den než dnešek, komponenta se nevykreslí
 * vůbec — přepnout ho zpátky na dnešek uprostřed listování by bylo
 * horší než nechat ho být.
 */

/** Dnešní datum v pásmu uživatele, ne v pásmu jeho zařízení. */
function dateIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Kolik milisekund zbývá do půlnoci v daném pásmu. */
function msUntilMidnight(timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const elapsed =
    value("hour") * 3_600_000 + value("minute") * 60_000 + value("second") * 1000;

  // Pár vteřin navíc, ať se netrefíme do poslední vteřiny starého dne.
  return 86_400_000 - elapsed + 5_000;
}

export function DayRollover({
  renderedDay,
  timeZone,
}: {
  /** Den, který stránka ukazuje, ve tvaru RRRR-MM-DD. */
  renderedDay: string;
  timeZone: string;
}) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      if (dateIn(timeZone) !== renderedDay) router.refresh();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    // Časovač se po každém spuštění přeplánuje — appka může běžet dny.
    const scheduleMidnight = () => {
      timer = setTimeout(() => {
        check();
        scheduleMidnight();
      }, msUntilMidnight(timeZone));
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    scheduleMidnight();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      if (timer) clearTimeout(timer);
    };
  }, [renderedDay, timeZone, router]);

  return null;
}
