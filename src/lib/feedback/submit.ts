import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { maskEmail } from "@/lib/visionboard/license";
import { siteUrl } from "@/lib/seo/site";
import { MAX_LENGTH, MIN_LENGTH } from "./limits";

/**
 * Hlášení od uživatele: co nefunguje nebo zlobí.
 *
 * Nejde jen o pády. Nejčastější důvod, proč lidé aplikaci zavřou, je
 * ovládání, které se chová jinak, než čekali — a to v žádném logu není.
 * Zachytit se to dá jedině tím, že se zeptáme a dáme tomu místo.
 *
 * Text je šifrovaný stejně jako obsah cílů; viz `ENCRYPTED_FIELDS`
 * v `lib/crypto/prisma-extension.ts`. Proto se v něm nedá vyhledávat
 * a výpis ve správě řadí podle data.
 */

export { MAX_LENGTH, MIN_LENGTH, PER_HOUR } from "./limits";

/** Uživatelské agenty umí mít kilobajt a delší nic nepřidá. */
const USER_AGENT_LIMIT = 200;

export type FeedbackContext = {
  /** Stránka, ze které to přišlo. Zjišťuje server, ne formulář. */
  path: string | null;
  locale: string;
  storeApp: boolean;
  userAgent: string | null;
};

/**
 * Ze které stránky hlášení přišlo.
 *
 * Bere se z hlavičky `Referer`, ne z těla požadavku. Kdyby to posílal
 * prohlížeč, dalo by se to podvrhnout a ve správě by stálo něco, co se
 * nestalo — u údaje, podle kterého se hledá chyba, je to horší než
 * žádný údaj.
 *
 * Ukládá se jen cesta, bez domény a bez parametrů: doména je vždycky
 * naše a v parametrech by se mohly vézt jednorázové kódy.
 */
export function pathFromReferer(referer: string | null): string | null {
  if (!referer) return null;

  try {
    return new URL(referer).pathname;
  } catch {
    return null;
  }
}

/** Zkrácení na rozumnou délku; prázdný řetězec se neukládá. */
export function trimUserAgent(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, USER_AGENT_LIMIT);
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: "tooShort" | "tooLong" };

export async function submitFeedback({
  userId,
  message,
  context,
}: {
  userId: string;
  message: string;
  context: FeedbackContext;
}): Promise<SubmitResult> {
  const text = message.trim();

  if (text.length < MIN_LENGTH) return { ok: false, error: "tooShort" };
  if (text.length > MAX_LENGTH) return { ok: false, error: "tooLong" };

  await db.feedback.create({
    data: {
      userId,
      message: text,
      path: context.path,
      locale: context.locale,
      storeApp: context.storeApp,
      userAgent: context.userAgent,
    },
  });

  // Uložit se povedlo, takže uživatel má hotovo. Co přijde dál, je
  // naše věc a nesmí se to na jeho potvrzení projevit.
  await notifyAdmins(userId, context).catch((error) => {
    console.error("[feedback] oznámení správcům selhalo", error);
  });

  return { ok: true };
}

/**
 * Uvozovky a špičaté závorky do HTML e-mailu.
 *
 * Maskovaný e-mail i cesta pocházejí z dat, ne z našeho textu. Cesta je
 * sice z `URL.pathname`, kde parser špičaté závorky sám překóduje, ale
 * spoléhat se na to u řetězce, který se lepí do HTML, je zbytečná
 * důvěra — a stojí to tři řádky.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Oznámení správcům — **bez textu hlášení**.
 *
 * Šifrovat text v databázi a vzápětí ho poslat nešifrovanou poštou do
 * schránky, kterou indexuje někdo třetí, by to šifrování zrušilo.
 * Nepohodlí je jedno kliknutí na odkaz do správy.
 */
async function notifyAdmins(
  userId: string,
  context: FeedbackContext,
): Promise<void> {
  const admins = env.adminEmails;
  if (admins.length === 0) return;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  const who = user ? maskEmail(user.email) : "neznámý účet";
  const where = context.path ?? "neznámá stránka";
  const link = `${siteUrl()}/${context.locale}/admin`;

  const text = [
    "Přišlo nové hlášení od uživatele.",
    "",
    `Od: ${who}`,
    `Ze stránky: ${where}`,
    `Jazyk: ${context.locale}${context.storeApp ? " · aplikace z obchodu" : ""}`,
    "",
    "Obsah tu schválně není — je šifrovaný a do e-mailu nepatří.",
    `Přečteš si ho ve správě: ${link}`,
  ].join("\n");

  const html = `<p>Přišlo nové hlášení od uživatele.</p>
<p>Od: ${escapeHtml(who)}<br>Ze stránky: ${escapeHtml(where)}<br>Jazyk: ${escapeHtml(
    context.locale,
  )}${context.storeApp ? " · aplikace z obchodu" : ""}</p>
<p>Obsah tu schválně není — je šifrovaný a do e-mailu nepatří.<br>
<a href="${link}">Přečteš si ho ve správě</a>.</p>`;

  await Promise.all(
    admins.map((to) =>
      sendEmail({ to, subject: "AlmostThere: nové hlášení", html, text }),
    ),
  );
}
