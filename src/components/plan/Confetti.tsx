"use client";

import { useEffect, useRef } from "react";

/**
 * Konfety na oslavné stránce.
 *
 * Jediné místo v aplikaci, kde se něco povedlo celé. Všechno ostatní je
 * pracovní, tak ať je aspoň tohle vidět.
 *
 * Barvy podle zvoleného motivu — konfety v limetkové na steampunkovém
 * papíru by vypadaly jako omyl. Minimalistický motiv má schválně
 * výjimku: je celý černobílý, takže by z jeho vlastních barev vyšly
 * šedé papírky. Dostává pastelovou modrou, zelenou a žlutou, aby oslava
 * aspoň jednou vnesla do toho prostředí život.
 *
 * ── Proč kreslení, a ne obrázek ─────────────────────────────────────
 *
 * Plátno umí sto padesát kousků papíru v šesti barvách za pár kilobajtů
 * a přizpůsobí se libovolné velikosti okna. Připravený obrázek by musel
 * existovat v šesti variantách a stejně by nepadal.
 *
 * ── Jednou a dost ───────────────────────────────────────────────────
 *
 * Doběhne a plátno se odstraní. Nekonečné konfety za textem, který si
 * má člověk přečíst, jsou po deseti vteřinách otrava — a tenhle text
 * je shrnutí několika měsíců jeho práce.
 */

/** Barvy konfet podle motivu. Poslední je vždy ta nejvýraznější. */
const PALETTES: Record<string, string[]> = {
  classic: ["#bef264", "#a3e635", "#34d399", "#f2f7f4", "#10b981"],
  steampunk: ["#c08a2c", "#8c6b3f", "#d9b06a", "#f3ead8", "#5c4326"],
  "sweet-pink": ["#e05b83", "#f2a0b8", "#f7d6e0", "#ffffff", "#c74169"],
  "sweet-blue": ["#3a92d1", "#7fc0ea", "#cfe8f7", "#ffffff", "#1f6fa8"],
  jungle: ["#4a9c3f", "#7bc46f", "#c9e4a8", "#f8f4e9", "#2f6b27"],
  /*
   * Minimalistický motiv je černobílý a z jeho vlastních barev by vyšly
   * šedé papírky. Pastelová trojice je jediná barva, kterou v tom
   * prostředí kdy uvidí — a je to schválně právě u oslavy.
   */
  minimalist: ["#9ec9e8", "#a8d8b9", "#f2dd9a", "#c5b8e0", "#8fbcd4"],
};

/** Kolik papírků. Dost na oslavu, málo na to, aby to trhalo. */
const COUNT = 150;

/** Jak dlouho padají, než se plátno uklidí. */
const DURATION_MS = 4500;

type Piece = {
  x: number;
  y: number;
  size: number;
  color: string;
  /** Rychlost pádu v pixelech za vteřinu. */
  fall: number;
  drift: number;
  spin: number;
  angle: number;
};

export function Confetti() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;

    /*
     * Kdo si vypnul pohyb v systému, ten ho nechce ani na oslavu.
     * Text a čísla na stránce zůstávají, takže o nic nepřijde.
     */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const theme = document.documentElement.dataset.theme ?? "classic";
    const colors = PALETTES[theme] ?? PALETTES.classic;

    const context = element.getContext("2d");
    if (!context) return;

    let width = (element.width = window.innerWidth);
    let height = (element.height = window.innerHeight);

    const pieces: Piece[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width,
      // Nad okrajem, aby se nezjevily uprostřed obrazovky.
      y: -Math.random() * height,
      size: 5 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      fall: 60 + Math.random() * 120,
      drift: (Math.random() - 0.5) * 60,
      spin: (Math.random() - 0.5) * 6,
      angle: Math.random() * Math.PI * 2,
    }));

    const onResize = () => {
      width = element.width = window.innerWidth;
      height = element.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    let frame = 0;
    let previous = performance.now();
    const started = previous;

    const draw = (now: number) => {
      // Krok podle uplynulého času, ne podle snímků — jinak by to na
      // rychlé obrazovce padalo dvakrát rychleji.
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;

      const elapsed = now - started;
      // Poslední vteřina se vytrácí, ať to nezmizí střihem.
      const fade = Math.max(0, Math.min(1, (DURATION_MS - elapsed) / 1000));

      context.clearRect(0, 0, width, height);
      context.globalAlpha = fade;

      for (const piece of pieces) {
        piece.y += piece.fall * delta;
        piece.x += piece.drift * delta;
        piece.angle += piece.spin * delta;

        if (piece.y > height + piece.size) {
          piece.y = -piece.size;
          piece.x = Math.random() * width;
        }

        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.color;
        // Obdélníky, ne čtverce — při otáčení to vypadá jako papír.
        context.fillRect(
          -piece.size / 2,
          -piece.size / 4,
          piece.size,
          piece.size / 2,
        );
        context.restore();
      }

      if (elapsed < DURATION_MS) {
        frame = requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, width, height);
      }
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
