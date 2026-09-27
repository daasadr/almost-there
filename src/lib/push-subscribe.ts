"use client";

import { readStored } from "@/lib/safe-storage";
import { DEFAULT_THEME, isTheme, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Přihlášení a odhlášení tohoto zařízení od oznámení.
 *
 * Sdílené místo pro nastavení připomínek i pro nabídku, která se ukáže
 * novému účtu. Obojí dělá totéž a rozejít se to nesmí: kdyby jedno
 * zapomnělo poslat motiv nebo uložit odběr, projeví se to až tím, že
 * někomu oznámení nechodí — a to nikdo nenahlásí.
 */

/**
 * Přihlášení tohoto zařízení k odběru.
 *
 * Vrací `true`, nebo důvod, proč to nejde — ten se uživateli ukáže.
 * Zamítnuté svolení se z kódu vrátit nedá; prohlížeč si ho pamatuje
 * a odvolat ho může jen člověk ve svém nastavení.
 */
export async function subscribe(
  vapidPublicKey: string,
): Promise<true | "blocked" | "dismissed" | "unsupported"> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }

  /*
   * Tři možné odpovědi, ne dvě.
   *
   * `denied` znamená zakázáno a to se odklikat nedá — musí se povolit
   * v nastavení prohlížeče. `default` znamená, že se okénko objevilo
   * a zmizelo bez odpovědi; tam stačí zkusit to znovu. Dokud se to
   * neodlišilo, dostal člověk, který jen nechtěně kliknul vedle, radu
   * hrabat se v nastavení prohlížeče.
   */
  const permission = await Notification.requestPermission();
  if (permission === "denied") return "blocked";
  if (permission !== "granted") return "dismissed";

  const registration = await navigator.serviceWorker.ready;

  // Existující odběr se použije, nový se vytvoří. Odebírat podruhé
  // s jiným klíčem prohlížeč odmítne.
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      // Bez tohohle prohlížeče odběr nepovolí: oznámení musí být vždycky
      // vidět, nesmí se posílat tiše na pozadí.
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  const json = subscription.toJSON();
  const stored = readStored(THEME_STORAGE_KEY);

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      // Ať oznámení vypadá jako aplikace, kterou tu člověk zná.
      theme: isTheme(stored) ? stored : DEFAULT_THEME,
    }),
  });

  return true;
}

export async function unsubscribe(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.ready;
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
  } catch {
    // Vypnutí připomínek se nesmí zaseknout na tom, že odhlášení
    // u prohlížeče selhalo. Rozhoduje nastavení na serveru.
  }
}

/**
 * Klíč z textové podoby do bajtů.
 *
 * VAPID klíč se předává jako base64url, ale `subscribe` chce pole bajtů.
 * Postup je daný specifikací a vypadá stejně v každé aplikaci, která
 * oznámení používá.
 */
function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);

  // Vlastní ArrayBuffer schválně: `new Uint8Array(délka)` má podle typů
  // obecný buffer, který `subscribe` nepřijme.
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
