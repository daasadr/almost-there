import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { deleteAccount } from "@/lib/account/delete";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  /**
   * Opsaný e-mail účtu. Zaškrtávátko ani druhé kliknutí nestačí — tohle
   * je nevratné a chceme mít jistotu, že uživatel ví, který účet ruší.
   * Zároveň to chrání před cizí stránkou, která by za přihlášeného
   * uživatele poslala požadavek: e-mail v ní nemá kde vzít.
   */
  confirm: z.string().min(1).max(320),
});

/**
 * Smazání účtu.
 *
 * Zásady ho slibují a Google Play ho u aplikací s účty přímo vyžaduje.
 * Nejde o deaktivaci: data opravdu zmizí, viz lib/account/delete.ts.
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Nevratná operace se nesmí dát zkoušet v cyklu — třeba při hádání,
  // který e-mail k účtu patří.
  const limit = checkRateLimit(
    `account-delete:${getClientIp(request.headers)}`,
    5,
    60 * 60 * 1000,
  );
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "rateLimited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "generic" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Velikost písmen ani mezery kolem nerozhodují — uživatel opisuje
  // z obrazovky a překlep v nich nic neznamená.
  if (
    parsed.data.confirm.trim().toLowerCase() !== user.email.trim().toLowerCase()
  ) {
    return NextResponse.json(
      { ok: false, error: "confirmMismatch" },
      { status: 400 },
    );
  }

  try {
    await deleteAccount(session.user.id);
  } catch (error) {
    console.error("[account] smazání účtu selhalo", error);
    return NextResponse.json({ ok: false, error: "generic" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
