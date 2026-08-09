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
          {
            /**
             * Obrana do hloubky proti vloženému skriptu.
             *
             * React sám o sobě text escapuje, takže XSS by musel vzniknout
             * chybou v kódu — jenže právě proti chybám tahle hlavička je.
             * I kdyby se skript do stránky dostal, nesmí načíst nic zvenčí
             * ani nikam odeslat, co našel.
             *
             * `unsafe-inline` u skriptů je ústupek Next.js, který vkládá
             * vlastní inline kód pro hydrataci. Odstranit ho jde jen přes
             * nonce v každém požadavku, což u staticky předgenerovaných
             * stránek nejde. Zbytek pravidel platí i tak: cizí doména se
             * nenačte, stránku nejde vložit do rámu a formulář nejde
             * přesměrovat jinam.
             */
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              // Platební stránka běží u Stripu, ne v rámu u nás.
              "frame-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
