import { describe, expect, it } from "vitest";
import { pageSocial } from "./metadata";

/**
 * Next.js metadata neslučuje do hloubky: jakmile stránka uvede vlastní
 * `openGraph`, ten z layoutu se celý zahodí. Stránka, která si chtěla
 * přepsat jen obrázek, tím tiše přijde i o `og:url` — a náhled odkazu
 * pak zahodí WhatsApp a další. Stalo se to stránkám šablon i všem
 * článkům a nikde to nespadlo.
 *
 * Tenhle test hlídá, že cesta, kterou mají všechny takové stránky
 * chodit, ty tři údaje opravdu doplňuje.
 */
describe("pageSocial", () => {
  const social = pageSocial({
    locale: "cs",
    path: "/templates/marathon",
    title: "Natrénovat na maraton",
    description: "Šest měsíců od prvních kilometrů k cíli.",
    image: "/og-template-marathon-cs.png",
    type: "article",
  });

  it("doplní údaje, o které by stránka jinak přišla", () => {
    expect(social.openGraph).toMatchObject({
      url: expect.stringContaining("/cs/templates/marathon"),
      siteName: "AlmostThere",
      locale: "cs",
    });
  });

  it("uvede obrázek i s rozměry a typem", () => {
    expect(social.openGraph?.images).toEqual([
      {
        url: "/og-template-marathon-cs.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Natrénovat na maraton",
      },
    ]);
  });

  it("dá stejný obrázek i Twitteru", () => {
    expect(social.twitter?.images).toEqual(["/og-template-marathon-cs.png"]);
  });
});
