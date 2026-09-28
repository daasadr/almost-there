import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { sendToUser } from "@/lib/notify/push";
import type { Locale } from "@/i18n/routing";

export const runtime = "nodejs";

/**
 * Zkušební oznámení sobě samému.
 *
 * Vzniklo z týdne, ve kterém se u každé stížnosti „nepřišlo mi nic"
 * hádalo mezi příčinami, které navenek vypadají stejně. Zjistit to šlo
 * jedině přes SSH, dotazem do databáze a čtením logu kontejneru — a to
 * je postup pro správce, ne pro člověka, který chce vědět, jestli mu
 * ráno něco přijde.
 *
 * Tohle odpoví okamžitě a konkrétně:
 *
 *   - `devices: 0` — tenhle účet nemá přihlášené žádné zařízení
 *   - `configured: false` — na serveru chybí klíče, neposílá se nikomu
 *   - `delivered: 1` — odešlo; když nic nevyskočilo, je to za naší
 *     hranicí, u prohlížeče nebo systému
 *   - `errors` — poštovní služba zásilku odmítla, a tady je proč
 *
 * Posílá jen sám sobě. Zneužít se tím nedá nic a zároveň to znamená, že
 * to nemusí být schované za právy správce — pomůže to i uživateli, který
 * si chce ověřit, že to nastavil dobře.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let locale: Locale = "cs";
  try {
    const body = (await request.json()) as { locale?: string };
    if (body.locale === "en" || body.locale === "de" || body.locale === "cs") {
      locale = body.locale;
    }
  } catch {
    // Bez těla se použije čeština. Na zkušební zprávě nezáleží tolik,
    // aby kvůli tomu měl požadavek spadnout.
  }

  const t = await getTranslations({ locale, namespace: "plan.notify.test" });

  const outcome = await sendToUser(session.user.id, {
    title: t("title"),
    body: t("body"),
    url: `/${locale}/app`,
    lang: locale,
    // Vlastní značka, ať zkušební zpráva nepřepíše ranní připomínku.
    tag: "almostthere-test",
  });

  return NextResponse.json({ ok: true, ...outcome });
}
