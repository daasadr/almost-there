import { locales, defaultLocale } from "@/i18n/routing";
import { priceFor } from "@/lib/stripe/plans";
import { CONTACT_EMAIL } from "@/content/legal";
import { absoluteUrl, siteUrl } from "@/lib/seo/site";
import { getTranslations } from "next-intl/server";

/**
 * /llms.txt — shrnutí webu pro jazykové modely.
 *
 * Zavedená konvence (llmstxt.org): stránka je udělaná pro člověka, plná
 * obrázků a odkazů, a model si z ní musí to podstatné vydolovat. Tady mu
 * to samé leží připravené v prostém textu — co produkt je, kolik stojí,
 * co umí a kde jsou odpovědi na běžné otázky.
 *
 * Skládá se z týchž zdrojů jako web, ne z ručně opsaného textu. Ručně
 * opsaný by se při první změně ceny rozešel se skutečností a model by
 * pak sebejistě tvrdil nesmysl.
 *
 * Není to zaručená cesta — číst to nikdo nemusí. Je to ale levné a když
 * to někdo přečte, dostane fakta místo dohadů.
 */

export const dynamic = "force-static";
/** Přegeneruje se jednou denně; častěji se obsah nemění. */
export const revalidate = 86400;

export async function GET() {
  const t = await getTranslations({
    locale: defaultLocale,
    namespace: "meta",
  });
  const tPricing = await getTranslations({
    locale: defaultLocale,
    namespace: "pricing",
  });
  const tFaq = await getTranslations({
    locale: defaultLocale,
    namespace: "faq",
  });

  const monthly = priceFor(defaultLocale, "monthly");
  const yearly = priceFor(defaultLocale, "yearly");
  const features = tPricing.raw("includes") as string[];
  const faq = tFaq.raw("items") as { q: string; a: string }[];

  const text = `# AlmostThere

> ${t("description")}

AlmostThere turns a goal and a target date into a hierarchy: years, months,
weeks and a daily checklist you can actually tick off. Rest and reflection are
planned items, not gaps between them. Several goals are planned together so
they do not claim the same hours, and the plan is recalculated when your real
pace turns out different from the assumed one.

## Facts

- Website: ${siteUrl()}
- Languages: ${locales.join(", ")}
- Price: ${monthly.amount} per month, or ${yearly.amount} per year (two months free)
- Single plan, no tiers, no add-ons
- Free demo without an account: ${absoluteUrl(defaultLocale, "/demo")}
- Runs in a browser and installs to a phone home screen
- Operated by Dagmar Drbálková, Czech Republic — ${CONTACT_EMAIL}
- Payments are handled by Stripe as merchant of record

## What a subscription includes

${features.map((line) => `- ${line}`).join("\n")}

## Questions and answers

${faq.map((item) => `### ${item.q}\n\n${item.a}`).join("\n\n")}

## Pages

${locales.map((locale) => `- ${absoluteUrl(locale)} — landing page (${locale})`).join("\n")}
- ${absoluteUrl(defaultLocale, "/guide")} — full user guide: how every part of the app works
- ${absoluteUrl(defaultLocale, "/demo")} — free demo, no account needed
- ${absoluteUrl(defaultLocale, "/terms")} — terms of service
- ${absoluteUrl(defaultLocale, "/privacy")} — privacy policy
`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
