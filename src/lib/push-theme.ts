import { readStored } from "@/lib/safe-storage";
import { DEFAULT_THEME, isTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/**
 * Srovnání zvoleného vzhledu s tím, co o zařízení ví server.
 *
 * Motiv se ukládá do prohlížeče, protože je to věc zařízení a oka, ne
 * profilu. Oznámení ale skládá server a potřebuje vědět, jakou ikonu
 * a jaký obrázek poslat — jinak by na Steampunku přišlo oznámení
 * v limetkové.
 *
 * Řeší se to tím, že si volbu pamatuje i odběr oznámení, a ten je
 * rovněž per zařízení. Tahle funkce ty dvě místa srovná.
 *
 * Mlčí, kdykoliv se něco nepovede: kdo odběr nemá, kdo je odhlášený,
 * kdo má oznámení zakázaná. Přepnutí vzhledu je věc na jedno kliknutí
 * a nesmí se u ní nic zdržovat ani hlásit.
 */
export async function syncPushTheme(theme?: Theme): Promise<void> {
  try {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    // Bez odběru není co srovnávat — a hlavně není komu posílat.
    if (!subscription) return;

    const stored = readStored(THEME_STORAGE_KEY);
    const chosen = theme ?? (isTheme(stored) ? stored : DEFAULT_THEME);

    const json = subscription.toJSON();

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
        theme: chosen,
      }),
    });
  } catch {
    // Vzhled se přepnul, to je to podstatné. Ikona v oznámení se srovná
    // při příštím přepnutí nebo při zapnutí připomínek.
  }
}
