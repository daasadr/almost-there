import "server-only";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe/client";
import { deleteGoalImages } from "@/lib/uploads/images";

/**
 * Skutečné smazání účtu.
 *
 * Ne deaktivace — v zásadách stojí, že výmaz znamená smazání dat, a to
 * musí platit doslova. Google Play navíc u aplikací s účty smazání přímo
 * vyžaduje.
 *
 * Pořadí kroků není libovolné:
 *
 *  1. Nejdřív se ruší předplatné ve Stripu. Kdyby se smazal účet a tohle
 *     selhalo, platby by běžely dál někomu, kdo už u nás nic nemá — a on
 *     by neměl jak je zastavit, protože by se neměl kam přihlásit. Proto
 *     když se výpověď nepovede, celé mazání se zastaví.
 *  2. Pak soubory na disku. Ty za databází nestojí a smazání řádku je
 *     samo nesmaže; osiřelé fotky by v úložišti zůstaly navždy.
 *  3. Nakonec řádek uživatele. Všechno ostatní na něm visí kaskádou,
 *     takže zmizí s ním v jedné transakci.
 *
 * Záznamy o spotřebě AI se schválně nemažou, jen se od uživatele odpojí
 * (`userId` na null). Nejsou v nich osobní údaje — jen model, počet
 * tokenů a cena — a bez nich by se zpětně rozpadl přehled nákladů.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      stripeSubscriptionId: true,
      goals: { select: { id: true } },
    },
  });

  if (!user) return;

  // 1. Předplatné. Okamžitě, ne ke konci období: uživatel odchází teď
  // a nemá jak se vrátit a zrušit ho později.
  if (user.stripeSubscriptionId) {
    await getStripe().subscriptions.cancel(user.stripeSubscriptionId);
  }

  // 2. Nahrané obrázky. Selhání tady mazání nezastaví — účet zmizet musí
  // a osiřelá složka je menší problém než účet, který nejde smazat.
  for (const goal of user.goals) {
    try {
      await deleteGoalImages(goal.id);
    } catch (error) {
      console.error("[account] obrázky cíle se nepodařilo smazat", {
        goalId: goal.id,
        error,
      });
    }
  }

  // 3. Odpojení účetních záznamů a smazání účtu. V jedné transakci —
  // kdyby se to rozpadlo mezi tím, zůstaly by záznamy viset na uživateli,
  // který už neexistuje, a cizí klíč by to stejně neprošel.
  await db.$transaction([
    db.aiUsageEvent.updateMany({
      where: { userId },
      data: { userId: null },
    }),
    db.user.delete({ where: { id: userId } }),
  ]);
}
