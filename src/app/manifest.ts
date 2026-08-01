import type { MetadataRoute } from "next";

/**
 * PWA manifest — appka jde nainstalovat na plochu mobilu.
 *
 * Service worker pro offline checklist zatím není: dává smysl až s denním
 * checklistem v plné verzi, kdy je co ukládat offline. Instalovatelnost
 * ale nic nestojí a je fajn ji mít od začátku.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AlmostThere",
    short_name: "AlmostThere",
    description: "Turn any goal into today's checklist.",
    start_url: "/",
    display: "standalone",
    background_color: "#04100c",
    theme_color: "#04100c",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
