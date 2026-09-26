"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { readStored, writeStored } from "@/lib/safe-storage";

/**
 * Oznámení o cookies — značka na okraji, ne lišta přes půl obrazovky.
 *
 * Dřív tu byla klasická lišta se dvěma tlačítky. Ta dávala smysl, dokud
 * měření návštěvnosti stálo na souhlasu. Dnes běží bez cookies, takže
 * se lišta ptala na rozhodnutí, které už nic neměnilo — a přitom
 * zabírala spodek obrazovky každému nově příchozímu.
 *
 * Cookies přesto máme: přihlášení, jazyk a převzetí cíle z dema. Jsou
 * nezbytné a souhlas nevyžadují, ale člověk má mít kde se o nich dozvědět,
 * aniž by kvůli tomu prolézal podmínky. Na to stačí tohle.
 *
 * ── Kde sedí a proč ──────────────────────────────────────────────────
 *
 * Vlevo dole. Vpravo dole je šipka nahoru a dvě plovoucí tlačítka vedle
 * sebe vypadají jako nepořádek.
 *
 * Odsazená od hrany, ne přilepená. Na Androidu se od kraje obrazovky
 * táhne gesto zpět a cokoliv přilepeného na hraně se pod ním otevírá
 * omylem — což je přesně ten druh otravnosti, kterou má tahle podoba
 * odstranit.
 *
 * ── Kdy se otevírá ───────────────────────────────────────────────────
 *
 * Dokud to člověk nevzal na vědomí, otevře ji i najetí myší — ať si toho
 * vůbec všimne. Potom už jen kliknutí. Nikdo nemá po dvacáté návštěvě
 * odhánět okénko, kolem kterého jen projel myší.
 */

const STORAGE_KEY = "almostthere.cookie-notice";

export function CookieNotice() {
  const t = useTranslations("cookies");

  const [open, setOpen] = useState(false);
  /** `null` = ještě nevíme; do té doby se na najetí nereaguje. */
  const [seen, setSeen] = useState<boolean | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeen(readStored(STORAGE_KEY) === "1");
  }, []);

  // Kliknutí mimo a Escape zavírají. Bez toho by okénko na dotykovém
  // displeji zůstalo otevřené, dokud by ho člověk netrefil znovu.
  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const acknowledge = () => {
    writeStored(STORAGE_KEY, "1");
    setSeen(true);
    setOpen(false);
  };

  const openOnHover = seen === false;

  return (
    <div
      ref={box}
      style={{
        bottom: "calc(1.25rem + env(safe-area-inset-bottom))",
        left: "calc(1.25rem + env(safe-area-inset-left))",
      }}
      className="fixed z-40 flex items-end gap-2"
      onMouseEnter={openOnHover ? () => setOpen(true) : undefined}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={t("title")}
        className="card grid h-9 w-9 shrink-0 place-items-center rounded-full opacity-60 shadow-2xl transition hover:border-edge-hover hover:opacity-100 focus-visible:opacity-100"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-4 w-4 fill-none stroke-[var(--color-paper-dim)] stroke-[1.8] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      {open && (
        <div
          role="note"
          className="card w-72 max-w-[calc(100vw-5rem)] p-4 shadow-2xl"
        >
          <p className="display text-sm">{t("title")}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-dim)]">
            {t("body")}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={acknowledge}
              className="btn-primary !px-3.5 !py-1.5 text-xs"
            >
              {t("acknowledge")}
            </button>
            <Link
              href="/privacy"
              className="text-xs text-[var(--color-paper-faint)] underline underline-offset-2 hover:text-[var(--color-paper)]"
            >
              {t("more")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
