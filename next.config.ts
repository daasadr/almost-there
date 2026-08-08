import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // standalone build = malý Docker image, běží přes `node server.js`
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,

  /**
   * Co se nemá dostat do produkčního balíčku.
   *
   * Ukládání obrázků skládá cesty za běhu (`path.resolve`, `fs.readFile`)
   * a sledovač závislostí z toho usoudí, že modul může sáhnout kamkoliv —
   * pro jistotu proto přibalí celý projekt. Tady mu říkáme, co v běhovém
   * image nemá co dělat: zadání, dokumentace, nasazovací skripty a
   * migrace, které spouští samostatný kontejner.
   */
  outputFileTracingExcludes: {
    "*": [
      "**/*.md",
      "Dockerfile",
      "docker-compose.yml",
      "deploy/**",
      "prisma/migrations/**",
      "tsconfig.tsbuildinfo",
      "uploads/**",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
