import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";
import { DEFAULT_THEME, isTheme } from "@/lib/theme";

/**
 * Odesílání webových oznámení.
 *
 * Prohlížeč oznámení nepřijímá přímo od nás — má vlastní poštovní službu
 * (Google u Chrome, Mozilla u Firefoxu) a my posíláme jí. Aby od nás
 * něco vzala, musí být zpráva podepsaná klíčem VAPID; veřejnou půlku
 * zná prohlížeč při přihlášení k odběru, soukromou jen server.
 *
 * Klíče se vyrábějí jednou příkazem `npx web-push generate-vapid-keys`
 * a patří do proměnných prostředí. Bez nich se oznámení neposílají
 * a aplikace to jen tiše přejde — nejsou to data, o která by šlo přijít.
 */

export type PushMessage = {
  title: string;
  body: string;
  /** Kam otevřít po klepnutí. Relativní adresa. */
  url: string;
  lang: string;
  /** Stejná značka přepíše předchozí oznámení místo hromadění. */
  tag: string;
  actions?: { action: string; title: string }[];
  /**
   * Kam vede které tlačítko. Bez toho míří všechna tam co klepnutí
   * na tělo oznámení — a „přečíst celé“ by nemělo kam.
   */
  actionUrls?: Record<string, string>;
  /** Doplňuje `sendToUser` podle motivu zařízení — viz `themeArt`. */
  icon?: string;
  image?: string;
};

let configured: boolean | null = null;

function ready(): boolean {
  if (configured !== null) return configured;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !contact) {
    configured = false;
    return false;
  }

  webpush.setVapidDetails(contact, publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Pošle oznámení na všechna zařízení jednoho uživatele.
 *
 * Vrací, na kolik zařízení se to povedlo. Nula znamená, že člověk sice
 * připomínky zapnuté má, ale žádné živé zařízení — typicky si vyčistil
 * prohlížeč.
 */
/**
 * Obrázky do oznámení podle zvoleného vzhledu.
 *
 * Vzhled oznámení kreslí operační systém a stránka do něj nemá co mluvit —
 * zaoblení, okraje ani barvy okna nastavit nelze. Ikona a velký obrázek
 * jsou jediné dvě plochy, které jsou naše, tak ať aspoň ony nesou barvy
 * motivu, na který je člověk v aplikaci zvyklý.
 *
 * Soubory vyrábí `npm run notify:assets`. Neznámý motiv (starý odběr,
 * přejmenovaný motiv) spadne na výchozí místo toho, aby zůstal bez ikony.
 */
function themeArt(theme: string): { icon: string; image: string } {
  const name = isTheme(theme) ? theme : DEFAULT_THEME;
  return {
    icon: `/notify/${name}-icon.png`,
    image: `/notify/${name}-banner.png`,
  };
}

export async function sendToUser(
  userId: string,
  message: PushMessage,
): Promise<number> {
  if (!ready()) return 0;

  const devices = await db.pushSubscription.findMany({
    where: { userId },
    // `theme` kvůli obrázkům: každé zařízení má vlastní volbu vzhledu
    // a oznámení má vypadat jako aplikace, kterou na něm člověk zná.
    select: { id: true, endpoint: true, p256dh: true, auth: true, theme: true },
  });

  let delivered = 0;
  const dead: string[] = [];

  await Promise.all(
    devices.map(async (device) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: device.endpoint,
            keys: { p256dh: device.p256dh, auth: device.auth },
          },
          // Zásilka se skládá pro každé zařízení zvlášť — liší se
          // obrázky podle motivu.
          JSON.stringify({ ...message, ...themeArt(device.theme) }),
          // Poštovní služba zprávu podrží, když je zařízení offline.
          // Den je dost: starší připomínka už nemá co připomínat.
          { TTL: 86_400 },
        );
        delivered += 1;
      } catch (error) {
        /*
         * 404 a 410 znamenají, že odběr už neexistuje — uživatel si
         * vyčistil prohlížeč nebo odvolal svolení. Takové záznamy se
         * musí mazat, jinak bychom donekonečna posílali do prázdna
         * a při každém běhu čekali na vypršení spojení.
         *
         * Ostatní chyby jsou výpadky a záznam se nechává být.
         */
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          dead.push(device.id);
        } else {
          console.error("[push] odeslání selhalo", status, device.endpoint);
        }
      }
    }),
  );

  if (dead.length) {
    await db.pushSubscription.deleteMany({ where: { id: { in: dead } } });
  }

  return delivered;
}

/** Je odesílání vůbec nastavené? Pro rozhraní, ať nenabízí, co nefunguje. */
export function pushConfigured(): boolean {
  return ready();
}
