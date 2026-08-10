import "server-only";
import { isTestMode } from "./client";

/**
 * Pojistka proti platbě naprázdno.
 *
 * Testovací a ostrý režim Stripu se liší jediným kusem řetězce v klíči.
 * Když na ostré adrese zůstanou testovací klíče, nic nespadne: zákazník
 * projde pokladnou, uvidí potvrzení, dostane přístup — a nezaplatí.
 * Přijde se na to podle chybějících peněz, obvykle po týdnech.
 *
 * Proto se v takovém případě pokladna raději neotevře vůbec. Nezaplacená
 * objednávka je nepříjemnost; objednávka, o které si obě strany myslí, že
 * zaplacená je, je problém.
 *
 * Pro případ, kdy je to úmysl — zkoušení na ostré adrese s testovací
 * kartou — existuje výslovný ventil `STRIPE_ALLOW_TEST_IN_PRODUCTION`.
 * Musí se zapnout vědomě a v ostrém provozu nemá co dělat.
 */
export function isFakeCheckout(): boolean {
  if (!isTestMode()) return false;
  if (process.env.STRIPE_ALLOW_TEST_IN_PRODUCTION === "true") return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return appUrl.startsWith("https://") && !appUrl.includes("localhost");
}
