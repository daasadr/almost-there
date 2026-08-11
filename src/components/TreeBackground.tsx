"use client";

import { useEffect, useRef } from "react";

/**
 * Ústřední vizuální motiv: strom, který se větví shora dolů — přesně jako
 * logika appky (cíl → měsíce → týdny → dny). Reaguje na pohyb kurzoru
 * (desktop) i na dotyk (mobil): větve se naklánějí za ukazatelem.
 *
 * Kreslí se na canvas, protože stovky větví jako DOM elementy by scroll
 * zabily. Struktura stromu se spočítá jednou, každý snímek se přepočítají
 * jen pozice.
 */

type Node = {
  parent: number; // -1 pro kmen
  depth: number;
  length: number;
  /** Odchylka od úhlu rodiče v radiánech. */
  angleOffset: number;
  /** Fázový posun, aby se větve nekývaly synchronně. */
  phase: number;
  // Přepočítává se každý snímek:
  x: number;
  y: number;
  angle: number;
};

const MAX_DEPTH = 9;
const TRUNK_ANGLE = 0;

/** Deterministický generátor — strom vypadá stejně při každém načtení. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function buildTree(): Node[] {
  const random = makeRandom(20260801);
  const nodes: Node[] = [
    {
      parent: -1,
      depth: 0,
      length: 1,
      angleOffset: TRUNK_ANGLE,
      phase: 0,
      x: 0,
      y: 0,
      angle: 0,
    },
  ];

  const grow = (parentIndex: number, depth: number) => {
    if (depth >= MAX_DEPTH) return;

    // Blíž ke kmeni dvě větve, výš občas tři — dává korunu hustší okraj.
    const branches = depth < 2 ? 2 : random() > 0.72 ? 3 : 2;

    for (let i = 0; i < branches; i += 1) {
      // Rozevření klesá s hloubkou, jinak se koruna rozpadne do stran.
      const spread = 0.62 - depth * 0.035;
      const centered = i / (branches - 1) - 0.5;
      const angleOffset = centered * spread * 2 + (random() - 0.5) * 0.22;

      // Každá další úroveň je kratší — odtud ta zužující se silueta.
      const length = (0.78 + random() * 0.14) * Math.pow(0.82, depth);

      nodes.push({
        parent: parentIndex,
        depth: depth + 1,
        length,
        angleOffset,
        phase: random() * Math.PI * 2,
        x: 0,
        y: 0,
        angle: 0,
      });
      grow(nodes.length - 1, depth + 1);
    }
  };

  grow(0, 0);
  return nodes;
}

export function TreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const nodes = buildTree();

    // Cíl a aktuální hodnota náklonu se drží zvlášť, aby pohyb kurzoru
    // strom netrhal — dojíždí se k cíli plynule.
    let windTarget = 0;
    let wind = 0;
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      windTarget = ((clientX - rect.left) / rect.width - 0.5) * 2;

      const glow = glowRef.current;
      if (glow) {
        glow.style.setProperty("--glow-x", `${clientX - rect.left}px`);
        glow.style.setProperty("--glow-y", `${clientY - rect.top}px`);
        glow.style.opacity = "1";
      }
    };

    const onMouseMove = (event: MouseEvent) =>
      onPointer(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) onPointer(touch.clientX, touch.clientY);
    };
    const onPointerLeave = () => {
      windTarget = 0;
      if (glowRef.current) glowRef.current.style.opacity = "0";
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Strom roste ze spodní hrany, mírně vpravo od středu — symetrie
      // uprostřed by soupeřila s textem hero sekce.
      const isNarrow = width < 768;
      const originX = width * (isNarrow ? 0.5 : 0.72);

      // Na mobilu roste strom z nižšího bodu a je o kousek menší. Na širokém
      // displeji stojí vedle textu, na úzkém pod ním — a koruna sahala až do
      // poznámky o demu, takže přes ni prosvítaly větve a text se hůř četl.
      const originY = height + height * (isNarrow ? 0.13 : 0.04);
      const scale = Math.min(width, height) * (isNarrow ? 0.175 : 0.16);

      wind += (windTarget - wind) * 0.045;

      const root = nodes[0];
      root.x = originX;
      root.y = originY;
      root.angle = TRUNK_ANGLE + wind * 0.06;
      const trunkLength = root.length * scale * 1.35;
      root.x = originX;
      root.y = originY;

      // Kmen vykreslíme zvlášť, ať má vlastní tloušťku a nezužuje se hned.
      const trunkTipX = originX + Math.sin(root.angle) * trunkLength;
      const trunkTipY = originY - Math.cos(root.angle) * trunkLength;

      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(trunkTipX, trunkTipY);
      ctx.lineWidth = Math.max(2, scale * 0.07);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.30)";
      ctx.stroke();

      root.x = trunkTipX;
      root.y = trunkTipY;

      for (let i = 1; i < nodes.length; i += 1) {
        const node = nodes[i];
        const parent = nodes[node.parent];

        // Vyšší větve se kývou víc — jako skutečný strom ve větru.
        const depthFactor = Math.pow(node.depth / MAX_DEPTH, 1.6);
        const idleSway = reduceMotion
          ? 0
          : Math.sin(time * 0.00042 + node.phase) * 0.035 * depthFactor;
        const pointerSway = wind * 0.42 * depthFactor;

        node.angle = parent.angle + node.angleOffset + idleSway + pointerSway;
        const length = node.length * scale;
        node.x = parent.x + Math.sin(node.angle) * length;
        node.y = parent.y - Math.cos(node.angle) * length;

        const t = node.depth / MAX_DEPTH;
        // Od kmene k listům: smaragdová → limetková, s purpurovým nádechem
        // na koncích, aby koruna nesplývala do jedné zelené plochy.
        const r = Math.round(16 + t * 147);
        const g = Math.round(185 + t * 45);
        const b = Math.round(129 - t * 76);
        const alpha = 0.09 + (1 - t) * 0.16;

        ctx.beginPath();
        ctx.moveTo(parent.x, parent.y);
        ctx.lineTo(node.x, node.y);
        ctx.lineWidth = Math.max(0.4, scale * 0.055 * (1 - t) ** 1.5);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.stroke();

        // Listy jen na koncích, s pomalým pulzem — drží pohled v koruně.
        if (node.depth === MAX_DEPTH) {
          const pulse = reduceMotion
            ? 0.5
            : 0.5 + Math.sin(time * 0.0011 + node.phase * 2.2) * 0.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 1.1 + pulse * 1.5, 0, Math.PI * 2);
          ctx.fillStyle =
            node.phase > 4.4
              ? `rgba(167, 139, 250, ${0.14 + pulse * 0.3})`
              : `rgba(190, 242, 100, ${0.12 + pulse * 0.28})`;
          ctx.fill();
        }
      }

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onPointerLeave);

    if (reduceMotion) {
      draw(0);
    } else {
      frame = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onPointerLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Statické podkladové záře — drží kompozici i než se spustí canvas */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 78% 88%, rgba(16,185,129,0.16), transparent 70%)," +
            "radial-gradient(50% 45% at 12% 8%, rgba(139,92,246,0.16), transparent 72%)," +
            "radial-gradient(40% 35% at 55% 40%, rgba(163,230,53,0.07), transparent 70%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Světlo pod kurzorem — samostatná vrstva, ať se nepřekresluje canvas */}
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0 transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(220px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(190,242,100,0.10), transparent 65%)",
        }}
      />
      {/* Zjemnění spodní hrany, aby canvas nekončil řezem */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[var(--color-ink-950)]" />
    </div>
  );
}
