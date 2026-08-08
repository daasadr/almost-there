import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/api/guard";
import { deleteGoalImages } from "@/lib/uploads/images";

export const runtime = "nodejs";

/**
 * Smazání cíle i s celým plánem.
 *
 * Maže se natvrdo, ne měkce: plán se dá kdykoliv vygenerovat znovu a držet
 * zahozené cíle v databázi by jen kazilo přehled. Bloky, úkoly i milníky
 * odejdou s ním díky kaskádě ve schématu.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSubscriber();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  // userId je součástí podmínky, ne kontrolou po načtení — cizí cíl tak
  // nesmaže ani někdo, kdo zná jeho id.
  const result = await db.goal.deleteMany({
    where: { id, userId: guard.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "notFound" }, { status: 404 });
  }

  // Kaskáda v databázi smaže záznamy o obrázcích, ale na disk nedosáhne.
  // Soubory smazaného cíle by tam jinak zůstaly ležet napořád.
  await deleteGoalImages(id);

  return NextResponse.json({ ok: true });
}
