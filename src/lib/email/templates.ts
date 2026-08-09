import "server-only";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

/**
 * Šablony e-mailů.
 *
 * Texty jdou přes překladový systém stejně jako UI (zadání, bod 10) —
 * `getTranslations` se dá volat i mimo požadavek, stačí předat jazyk.
 *
 * Záměrně světlý podklad, i když je značka tmavá: tmavé e-maily si
 * poštovní klienti v tmavém režimu překreslují po svém a výsledek bývá
 * nečitelný. Styly jsou vepsané do atributů, protože Gmail a Outlook
 * `<style>` bloky ořezávají.
 */

const BRAND_GREEN = "#0f7a5a";
const INK = "#12211b";
const MUTED = "#5c6f66";
const BORDER = "#e2eae6";

function layout(options: {
  heading: string;
  paragraphs: string[];
  buttonLabel: string;
  buttonUrl: string;
  fallbackNote: string;
  footer: string;
}): string {
  const paragraphs = options.paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK}">${escapeHtml(text)}</p>`,
    )
    .join("");

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f7f5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;padding:32px">
          <tr>
            <td>
              <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:${INK};margin-bottom:28px">
                Almost<span style="color:${BRAND_GREEN}">There</span>
              </div>

              <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:700;letter-spacing:-0.02em;color:${INK}">
                ${escapeHtml(options.heading)}
              </h1>

              ${paragraphs}

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0">
                <tr>
                  <td style="border-radius:999px;background:${BRAND_GREEN}">
                    <a href="${options.buttonUrl}"
                       style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">
                      ${escapeHtml(options.buttonLabel)}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${MUTED}">
                ${escapeHtml(options.fallbackNote)}
              </p>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all">
                <a href="${options.buttonUrl}" style="color:${BRAND_GREEN}">${options.buttonUrl}</a>
              </p>

              <hr style="border:none;border-top:1px solid ${BORDER};margin:24px 0" />

              <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED}">
                ${escapeHtml(options.footer)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainText(options: {
  heading: string;
  paragraphs: string[];
  buttonUrl: string;
  footer: string;
}): string {
  return [
    options.heading,
    "",
    ...options.paragraphs,
    "",
    options.buttonUrl,
    "",
    "—",
    options.footer,
  ].join("\n");
}

export type BuiltEmail = { subject: string; html: string; text: string };

/** E-mail s odkazem na ověření adresy po registraci. */
export async function buildVerificationEmail(
  locale: Locale,
  verifyUrl: string,
  name: string,
): Promise<BuiltEmail> {
  const t = await getTranslations({ locale, namespace: "emails.verify" });

  const heading = t("heading", { name });
  const paragraphs = [t("body"), t("expiry")];
  const footer = t("footer");

  return {
    subject: t("subject"),
    html: layout({
      heading,
      paragraphs,
      buttonLabel: t("button"),
      buttonUrl: verifyUrl,
      fallbackNote: t("fallback"),
      footer,
    }),
    text: plainText({ heading, paragraphs, buttonUrl: verifyUrl, footer }),
  };
}

/** E-mail s odkazem na nastavení nového hesla. */
export async function buildPasswordResetEmail(
  locale: Locale,
  resetUrl: string,
): Promise<BuiltEmail> {
  const t = await getTranslations({ locale, namespace: "emails.reset" });

  const heading = t("heading");
  const paragraphs = [t("body"), t("expiry"), t("ignore")];
  const footer = t("footer");

  return {
    subject: t("subject"),
    html: layout({
      heading,
      paragraphs,
      buttonLabel: t("button"),
      buttonUrl: resetUrl,
      fallbackNote: t("fallback"),
      footer,
    }),
    text: plainText({ heading, paragraphs, buttonUrl: resetUrl, footer }),
  };
}

/**
 * Potvrzení o souhlasu se zahájením plnění před uplynutím lhůty
 * pro odstoupení.
 *
 * Nejde o zdvořilost, ale o zákonnou náležitost: § 1837 OZ vyžaduje,
 * aby podnikatel o takovém souhlasu vydal potvrzení. Věta v podmínkách
 * na to nestačí.
 */
export async function buildPurchaseConfirmationEmail(
  locale: Locale,
  withdrawalUrl: string,
): Promise<BuiltEmail> {
  const t = await getTranslations({ locale, namespace: "emails.purchase" });

  const heading = t("heading");
  const paragraphs = [t("body"), t("consent"), t("withdrawal")];
  const footer = t("footer");

  return {
    subject: t("subject"),
    html: layout({
      heading,
      paragraphs,
      buttonLabel: t("button"),
      buttonUrl: withdrawalUrl,
      fallbackNote: t("fallback"),
      footer,
    }),
    text: plainText({ heading, paragraphs, buttonUrl: withdrawalUrl, footer }),
  };
}
