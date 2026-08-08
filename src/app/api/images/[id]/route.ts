import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { deleteImage, readImage } from "@/lib/uploads/images";

export const runtime = "nodejs";

/**
 * Vydání obrázku.
 *
 * Soubory neservíruje nginx přímo, ale aplikace — jinak by je stačilo
 * uhodnout adresou. Můžou to být osobní fotky, tak se u každého požadavku
 * ověří, že obrázek patří cíli přihlášeného uživatele.
 *
 * Nekontroluje se předplatné, jen přihlášení: kdo přestane platit, nesmí
 * kvůli tomu přijít o vlastní obrázky.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }

  const { id } = await params;

  const image = await db.goalImage.findFirst({
    where: { id, goal: { userId: session.user.id } },
    select: { storageKey: true, byteSize: true },
  });
  if (!image) return new NextResponse(null, { status: 404 });

  try {
    const data = await readImage(image.storageKey);

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(data.byteLength),
        // Obsah pod daným id se nikdy nemění, tak ať se na něj neptá znovu.
        // `private` proto, že mezilehlá cache to ukládat nesmí.
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    // Záznam v databázi je, soubor ne — typicky po neúplném obnovení zálohy.
    console.error("[images] soubor chybí", image.storageKey, error);
    return new NextResponse(null, { status: 404 });
  }
}

/** Smazání obrázku. Nejdřív záznam, pak soubor. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const image = await db.goalImage.findFirst({
    where: { id, goal: { userId: guard.user.id } },
    select: { id: true, storageKey: true },
  });
  if (!image) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  await db.goalImage.delete({ where: { id: image.id } });

  // Soubor až po záznamu: osiřelý soubor jen zabírá místo, kdežto záznam
  // bez souboru se v aplikaci projeví jako rozbitý obrázek.
  await deleteImage(image.storageKey);

  return NextResponse.json({ ok: true });
}
