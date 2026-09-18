"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { DayProgress } from "@/lib/goals/checkin";

/**
 * Obrázek s postupem ke sdílení.
 *
 * Odpovědnost před ostatními drží člověka u dlouhého cíle spolehlivěji
 * než plán sám — kdo svůj postup zveřejňuje, přestat je vidět. Místo
 * stavění sociální sítě uvnitř aplikace proto stačí umožnit sdílení ven,
 * tam, kde uživatelé už jsou.
 *
 * Kreslí se v prohlížeči, ne na serveru. Důvodů je několik a každý sám
 * o sobě by stačil: server běží na Alpine bez nainstalovaných písem,
 * takže by z textu vyšly prázdné obdélníky; písma značky jsou v prohlížeči
 * už načtená; a obrázek nikam neputuje, vzniká na zařízení a tam se rovnou
 * sdílí.
 *
 * Název cíle na obrázku schválně není. Postup je pochlubení, cíl je
 * soukromá věc — kdo ho zmínit chce, napíše si ho do popisku sám.
 */

/** Čtverec sedne na většinu sítí bez ořezu. */
const SIZE = 1080;
const PADDING = 90;

export function ShareProgress({ days }: { days: DayProgress[] }) {
  const t = useTranslations("plan.share");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<"saved" | "failed" | null>(null);

  const planned = days.filter((day) => day.total > 0);
  const complete = planned.filter((day) => day.done === day.total).length;

  // Bez jediného naplánovaného dne není co ukazovat.
  if (planned.length === 0) return null;

  const share = async () => {
    setBusy(true);
    setNote(null);

    try {
      // Bez tohohle by se první obrázek nakreslil náhradním písmem —
      // prohlížeč si vlastní písmo dotahuje až když ho potřebuje.
      await document.fonts.ready;

      const blob = await drawCard({
        days,
        title: t("cardTitle"),
        stat: t("cardStat", { done: complete, total: planned.length }),
      });

      const file = new File([blob], "almostthere.png", { type: "image/png" });

      // Na telefonu se otevře systémová nabídka sdílení. Na počítači
      // většinou není, tam se obrázek stáhne a uživatel si ho vloží sám.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("shareTitle"),
          text: t("shareText"),
        });
      } else {
        download(blob);
        setNote("saved");
      }
    } catch (error) {
      // Zavření systémové nabídky vyhodí AbortError. To není chyba
      // a hlásit ji uživateli by bylo matoucí.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setNote("failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void share()}
        disabled={busy}
        className="rounded-full border border-edge-strong px-4 py-2 text-sm text-[var(--color-paper-dim)] transition hover:border-edge-hover hover:text-[var(--color-paper)] disabled:opacity-50"
      >
        {busy ? t("working") : t("button")}
      </button>

      {note && (
        <p
          role="status"
          className="mt-2 text-xs text-[var(--color-paper-faint)]"
        >
          {t(note)}
        </p>
      )}
    </div>
  );
}

function download(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "almostthere.png";
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Vykreslení karty.
 *
 * Rozvržení je psané v pevných bodech, ne v poměrech. U jediného rozměru
 * je to čitelnější než přepočty a nikdo tu kartu nebude zmenšovat.
 */
async function drawCard({
  days,
  title,
  stat,
}: {
  days: DayProgress[];
  title: string;
  stat: string;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  // Podklad a jemná záře vpravo nahoře — stejná jako na webu, aby obrázek
  // nevypadal jako od někoho jiného.
  ctx.fillStyle = "#04100c";
  ctx.fillRect(0, 0, SIZE, SIZE);

  const glow = ctx.createRadialGradient(
    SIZE * 0.85,
    SIZE * 0.12,
    0,
    SIZE * 0.85,
    SIZE * 0.12,
    SIZE * 0.7,
  );
  glow.addColorStop(0, "rgba(163, 230, 53, 0.16)");
  glow.addColorStop(1, "rgba(163, 230, 53, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  drawLogo(ctx, PADDING, PADDING + 10);

  ctx.fillStyle = "#e8f0ea";
  ctx.font = "600 40px 'Instrument Sans', system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("AlmostThere", PADDING + 78, PADDING + 44);

  // Nadpis karty.
  ctx.fillStyle = "#7a9187";
  ctx.font = "500 32px 'Instrument Sans', system-ui, sans-serif";
  ctx.fillText(title.toUpperCase(), PADDING, 330);

  // Hlavní údaj. Velké číslo nese sdělení i v náhledu velikosti nehtu.
  ctx.fillStyle = "#f2f7f4";
  ctx.font = "700 92px 'Bricolage Grotesque', system-ui, sans-serif";
  ctx.fillText(stat, PADDING, 440);

  drawStrip(ctx, days, PADDING, 560, SIZE - PADDING * 2, 220);

  // Patička.
  const line = ctx.createLinearGradient(PADDING, 0, PADDING + 110, 0);
  line.addColorStop(0, "#bef264");
  line.addColorStop(1, "#34d399");
  ctx.fillStyle = line;
  ctx.fillRect(PADDING, SIZE - 175, 110, 4);

  ctx.fillStyle = "#7a9187";
  ctx.font = "500 32px 'Instrument Sans', system-ui, sans-serif";
  ctx.fillText("almost-there.eu", PADDING, SIZE - 110);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}

/** Proužek dnů, stejný jazyk jako ProgressStrip na webu. */
function drawStrip(
  ctx: CanvasRenderingContext2D,
  days: DayProgress[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const gap = 8;
  const barWidth = (width - gap * (days.length - 1)) / days.length;

  for (const [index, day] of days.entries()) {
    const left = x + index * (barWidth + gap);

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    roundedRect(ctx, left, y, barWidth, height, 6);
    ctx.fill();

    if (day.total === 0) continue;

    // Odspodu nahoru, aby i jeden hotový úkol byl vidět.
    const share = Math.max(0.12, day.done / day.total);
    const barHeight = height * share;

    const fill = ctx.createLinearGradient(0, y + height, 0, y + height - barHeight);
    fill.addColorStop(0, "#34d399");
    fill.addColorStop(1, "#bef264");

    ctx.globalAlpha = day.done === 0 ? 0.2 : 1;
    ctx.fillStyle = fill;
    roundedRect(ctx, left, y + height - barHeight, barWidth, barHeight, 6);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** Značka. Stejné tvary jako components/Logo.tsx a jako u OG obrázků. */
function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.7, 1.7);

  const brand = ctx.createLinearGradient(0, 30, 30, 0);
  brand.addColorStop(0, "#34d399");
  brand.addColorStop(0.6, "#bef264");
  brand.addColorStop(1, "#c4b5fd");

  ctx.strokeStyle = brand;
  ctx.lineWidth = 2.1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const branches: [number, number, number, number][] = [
    [16, 30, 16, 17],
    [16, 17, 8.5, 10.5],
    [16, 17, 23.5, 10.5],
    [8.5, 10.5, 5, 5.5],
    [8.5, 10.5, 12, 5.5],
    [23.5, 10.5, 20, 5.5],
    [23.5, 10.5, 27, 5.5],
  ];

  for (const [x1, y1, x2, y2] of branches) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.fillStyle = "#bef264";
  for (const cx of [5, 12, 20]) {
    ctx.beginPath();
    ctx.arc(cx, 4.6, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#c4b5fd";
  ctx.beginPath();
  ctx.arc(27, 5.5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
