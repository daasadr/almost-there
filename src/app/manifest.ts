import type { MetadataRoute } from "next";

/**
 * PWA manifest — appka jde nainstalovat na plochu telefonu.
 *
 * `start_url` míří rovnou na dnešek, ne na úvodní stránku. Kdo si appku
 * nainstaloval, cíl už zná; marketingová stránka by mu při každém spuštění
 * jen překážela. Nepřihlášeného odtud middleware pošle na přihlášení.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AlmostThere",
    short_name: "AlmostThere",
    description: "Turn any goal into today's checklist.",
    start_url: "/cs/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#04100c",
    theme_color: "#04100c",
    categories: ["productivity", "lifestyle"],
    icons: [
      // SVG zvládne libovolnou velikost, ale ne každý systém ho u ikon
      // přijme — proto vedle něj i rastrové varianty.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // Android si z maskovatelné ikony ořízne vlastní tvar. Kresba v ní
      // sedí uvnitř bezpečné zóny, aby o okraje nepřišla.
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Dnešek",
        url: "/cs/app",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Nový cíl",
        url: "/cs/app/goals/new",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
