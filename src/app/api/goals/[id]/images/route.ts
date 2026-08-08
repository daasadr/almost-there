import { NextResponse } from "next/server";
import { createId } from "@/lib/ids";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import {
  MAX_IMAGES_PER_GOAL,
  MAX_UPLOAD_BYTES,
  storeImage,
} from "@/lib/uploads/images";

export const runtime = "nodejs";

/** Nahrání motivačního obrázku k cíli. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const goal = await db.goal.findFirst({
    where: { id, userId: guard.user.id },
    select: { id: true, _count: { select: { images: true } } },
  });
  if (!goal) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  if (goal._count.images >= MAX_IMAGES_PER_GOAL) {
    return NextResponse.json(
      { ok: false, error: "tooManyImages" },
      { status: 409 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { ok: false, error: "imageTooLarge" },
      { status: 413 },
    );
  }

  const alt = form.get("alt");
  const imageId = createId();

  try {
    const stored = await storeImage({
      goalId: goal.id,
      imageId,
      input: Buffer.from(await file.arrayBuffer()),
    });

    const image = await db.goalImage.create({
      data: {
        id: imageId,
        goalId: goal.id,
        ...stored,
        alt: typeof alt === "string" && alt.trim() ? alt.trim().slice(0, 200) : null,
      },
      select: { id: true, width: true, height: true, alt: true },
    });

    return NextResponse.json({ ok: true, image });
  } catch (error) {
    // Sem spadne i soubor, který obrázek jen předstírá — sharp ho odmítne.
    console.error("[images] nahrání selhalo", error);
    return NextResponse.json(
      { ok: false, error: "imageUnreadable" },
      { status: 415 },
    );
  }
}
