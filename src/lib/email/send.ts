import "server-only";
import { Resend } from "resend";

/**
 * Odesílání e-mailů přes Resend.
 *
 * Bez `RESEND_API_KEY` se e-mail neodešle, ale vypíše se do konzole včetně
 * odkazů. Celý tok registrace i resetu hesla tak jde otestovat lokálně
 * dřív, než je doména v Resendu ověřená.
 */

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Textová varianta. Bez ní filtry hodnotí zprávu hůř. */
  text: string;
};

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const from = process.env.EMAIL_FROM ?? "AlmostThere <noreply@almost-there.eu>";
  const resend = getClient();

  if (!resend) {
    // Vývojový režim — odkaz vytáhneme, ať se dá rovnou kliknout.
    const link = input.text.match(/https?:\/\/\S+/)?.[0];
    console.log(
      [
        "",
        "──────────── E-MAIL (neodeslán, chybí RESEND_API_KEY) ────────────",
        `komu:    ${input.to}`,
        `předmět: ${input.subject}`,
        link ? `odkaz:   ${link}` : "",
        "──────────────────────────────────────────────────────────────────",
        "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    return { ok: true, id: null };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      console.error("[email] Resend odmítl odeslání:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id ?? null };
  } catch (error) {
    console.error("[email] odeslání selhalo:", error);
    return { ok: false, error: "send_failed" };
  }
}
