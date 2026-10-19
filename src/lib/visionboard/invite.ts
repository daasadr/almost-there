import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Osobní pozvánka k Vision Boardu.
 *
 * Každý účet má trvalý odkaz, který smí poslat komukoliv a kolikrát
 * chce. Pozvaný se zaregistruje a licenci dostane jako každý jiný —
 * pozvánka sama nic neodemyká. Smysl je přivést nové účty, ne rozdávat
 * víc než ostatním.
 *
 * Aplikace Vision Board o pozvánkách neví vůbec; jsou celé na webu.
 */

const COOKIE = "vb_ref";
const TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Kód pozvánky.
 *
 * Šestnáct znaků base64url z náhodných bajtů. Neprozrazuje id ani
 * e-mail: kdyby v něm bylo id účtu, dal by se z každého sdíleného
 * odkazu vyčíst identifikátor, se kterým se dá dál zkoušet.
 */
function newCode(): string {
  return randomBytes(12).toString("base64url");
}

/**
 * Odkaz uživatele. Vyrobí se, až když si ho někdo poprvé zobrazí.
 *
 * Líně schválně: většina lidí pozvánku nikdy neotevře a plnit tabulku
 * kódy do zásoby nemá cenu. Souběh dvou požadavků řeší unikátní index —
 * druhý zápis selže a přečte se, co zapsal první.
 */
export async function inviteCodeFor(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { visionBoardRef: true },
  });

  if (user?.visionBoardRef) return user.visionBoardRef;

  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: { visionBoardRef: newCode() },
      select: { visionBoardRef: true },
    });
    return updated.visionBoardRef!;
  } catch {
    const again = await db.user.findUnique({
      where: { id: userId },
      select: { visionBoardRef: true },
    });
    if (again?.visionBoardRef) return again.visionBoardRef;
    throw new Error("Kód pozvánky se nepodařilo vyrobit.");
  }
}

/** Kolik lidí se přes pozvánku zaregistrovalo. */
export function invitedCount(userId: string): Promise<number> {
  return db.user.count({ where: { invitedById: userId } });
}

/**
 * Zapamatuje si, kdo koho přivedl.
 *
 * Cookie, protože mezi klepnutím na odkaz a dokončením registrace je
 * několik stránek a uživatel si mezitím může odskočit. Třicet dní je
 * štědré — pozvánka se často otevře, odloží a vyřídí jindy.
 */
export async function rememberReferrer(code: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(code)) return;

  (await cookies()).set(COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

/**
 * Kdo pozval toho, kdo se právě registruje.
 *
 * Neznámý nebo podvržený kód vrací prázdno a registraci **nikdy
 * neblokuje**. Pozvánka je přílepek k registraci, ne podmínka — kdyby
 * kvůli ní zakládání účtu selhalo, byla by to ta nejdražší možná chyba.
 */
export async function resolveReferrer(): Promise<string | null> {
  const code = (await cookies()).get(COOKIE)?.value;
  if (!code) return null;

  try {
    const inviter = await db.user.findUnique({
      where: { visionBoardRef: code },
      select: { id: true, deletedAt: true },
    });
    return inviter && !inviter.deletedAt ? inviter.id : null;
  } catch {
    return null;
  }
}
