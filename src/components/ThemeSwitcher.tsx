"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { readStored, writeStored } from "@/lib/safe-storage";
import {
  DEFAULT_THEME,
  isTheme,
  THEMES,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

/**
 * Přepínač vzhledu.
 *
 * Vzhled je to jediné, co člověk vidí dřív, než pochopí, k čemu je
 * aplikace dobrá. Tmavé rozhraní část lidí odradí dřív, než se dostanou
 * k obsahu — a vnutit jim ho je zbytečná ztráta.
 *
 * Volba se ukládá do prohlížeče, ne k účtu. Je to věc zařízení a oka,
 * ne profilu: na telefonu v posteli chce člověk často něco jiného než
 * na monitoru v poledne. Navíc tak funguje i bez přihlášení.
 *
 * Náhledová kolečka jsou důležitější než názvy. „Steampunk“ nikomu
 * neřekne, jak to bude vypadat; tři barevné tečky ano.
 */

/** Náhled motivu: podklad, akcent, text. Musí sedět s globals.css. */
const SWATCHES: Record<Theme, [string, string, string]> = {
  classic: ["#04100c", "#bef264", "#f2f7f4"],
  steampunk: ["#f3ead8", "#c08a2c", "#2c2016"],
  "sweet-pink": ["#fffaf8", "#e05b83", "#3a2530"],
  "sweet-blue": ["#f9fcff", "#3a92d1", "#23303c"],
  jungle: ["#f8f4e9", "#4a9c3f", "#1d2b1a"],
  minimalist: ["#ffffff", "#101010", "#414141"],
};

export function ThemeSwitcher() {
  const t = useTranslations("theme");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const box = useRef<HTMLDivElement>(null);

  /**
   * Srovnání značky na `<html>` s uloženou volbou, po každé navigaci.
   *
   * Při načtení stránky ji nastaví skript v hlavičce a pak by stačilo
   * jen přečíst stav. Jenže přepnutí jazyka je navigace na jinou větev
   * `[locale]`, při které se překreslí i `<html lang>` — a React u toho
   * zahodí značku, protože ji tam nedal on, ale skript. Vzhled se vrátil
   * na výchozí, zatímco ikonka dál četla z úložiště a ukazovala správně.
   *
   * Proto se to sjednotí tady a při každé změně cesty. Když značka platí,
   * nastavení té samé hodnoty nic nestojí a nic neprobliká.
   */
  useEffect(() => {
    const stored = readStored(THEME_STORAGE_KEY);
    const next = isTheme(stored) ? stored : DEFAULT_THEME;

    setTheme(next);

    if (next === DEFAULT_THEME) {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = next;
    }
  }, [pathname]);

  // Zavřít klepnutím vedle a klávesou Escape — obojí lidé u rozbalovacích
  // nabídek čekají a bez toho nabídka působí, že se zasekla.
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

  const choose = (next: Theme) => {
    setTheme(next);
    setOpen(false);

    // Classic je výchozí a značku nepotřebuje — bez ní platí `:root`.
    if (next === DEFAULT_THEME) {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = next;
    }

    writeStored(THEME_STORAGE_KEY, next);
  };

  const current = SWATCHES[theme];

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("label")}
        className="flex items-center gap-2 rounded-full border border-edge-strong px-2.5 py-1.5 transition hover:border-edge-hover"
      >
        {/* Tři tečky aktuálního motivu. Tlačítko tím rovnou říká, co dělá,
            a v jakémkoliv jazyce. */}
        <span aria-hidden="true" className="flex">
          {current.map((color, index) => (
            <span
              key={color}
              style={{ background: color }}
              className={`h-3.5 w-3.5 rounded-full border border-edge ${
                index > 0 ? "-ml-1.5" : ""
              }`}
            />
          ))}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="card absolute right-0 z-50 mt-2 w-60 overflow-hidden p-1.5 shadow-2xl"
        >
          {THEMES.map((option) => {
            const swatch = SWATCHES[option];
            const selected = option === theme;

            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => choose(option)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  selected ? "bg-surface-strong" : "hover:bg-surface"
                }`}
              >
                <span aria-hidden="true" className="flex shrink-0">
                  {swatch.map((color, index) => (
                    <span
                      key={color}
                      style={{ background: color }}
                      className={`h-4 w-4 rounded-full border border-edge ${
                        index > 0 ? "-ml-2" : ""
                      }`}
                    />
                  ))}
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--color-paper)]">
                    {t(option)}
                  </span>
                  <span className="block text-xs text-[var(--color-paper-faint)]">
                    {t(`${option}Note`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
