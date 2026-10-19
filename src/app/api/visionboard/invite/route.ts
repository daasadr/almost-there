import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { inviteCodeFor, invitedCount } from "@/lib/visionboard/invite";
import { siteUrl } from "@/lib/seo/site";

export const runtime = "nodejs";

/**
 * Osobní pozvánka přihlášeného uživatele.
 *
 * Čte se z prohlížeče ze stejného důvodu jako seznam zařízení: stránka
 * Extra je veřejná a generuje se při sestavení, takže se na ní nesmí
 * sahat na přihlášení.
 *
 * Kód se vyrobí teprve tímhle voláním, tedy až když si ho někdo chce
 * zobrazit. Většina lidí pozvánku nikdy neotevře.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ signedIn: false });
  }

  const [code, accepted] = await Promise.all([
    inviteCodeFor(session.user.id),
    invitedCount(session.user.id),
  ]);

  return NextResponse.json({
    signedIn: true,
    url: `${siteUrl()}/visionboard?ref=${code}`,
    accepted,
  });
}
