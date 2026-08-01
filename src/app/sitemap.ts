import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";

const PATHS = ["", "/demo", "/terms", "/privacy"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    .replace(/\/+$/, "");

  return locales.flatMap((locale) =>
    PATHS.map((path) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
  );
}
