import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { SettingsForm } from "@/components/plan/SettingsForm";
import { DailyReminder } from "@/components/native/DailyReminder";
import { NotifySettings } from "@/components/plan/NotifySettings";
import { DeleteAccount } from "@/components/account/DeleteAccount";
import { db } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plan.settings" });
  return { title: `${t("title")} — AlmostThere` };
}

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale } = await params;

  // Kdo sem odskočil od rozepsaného cíle, se tam musí umět vrátit.
  // Bez toho zůstal stát na uložené stránce a hledal cestu zpátky.
  const { from } = await searchParams;
  const backToGoal = from === "new-goal";
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  // Předvolby jsou dostupné i bez předplatného — jsou to údaje o uživateli,
  // ne funkce produktu, a měnit si je má právo kdykoliv.
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      email: true,
      dailyCapacityMinutes: true,
      reflectionMinutesDay: true,
      restFrequency: true,
      timezone: true,
      rewardLikes: true,
      rewardDislikes: true,
      notifyMode: true,
      notifyTime: true,
      notifyEvening: true,
    },
  });

  /*
   * Veřejná půlka podpisového klíče pro oznámení.
   *
   * Bez nastavených klíčů se nabídka vůbec neukáže — nabízet funkci,
   * která by mlčky nefungovala, je horší než ji nemít. Soukromá půlka
   * zůstává na serveru, tahle je veřejná a patří do prohlížeče.
   */
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? "";

  const t = await getTranslations({ locale, namespace: "plan.settings" });

  return (
    <section className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      {backToGoal && (
        <Link
          href={`/${locale}/app/goals/new`}
          className="mt-6 inline-block text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
        >
          ← {t("backToGoal")}
        </Link>
      )}

      <h1 className="display mt-6 text-3xl sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("subtitle")}
      </p>

      <div className="card mt-8 p-6 sm:p-8">
        <SettingsForm initial={user} backToGoal={backToGoal} />
      </div>

      {/* V prohlížeči se nevykreslí — systémová oznámení umí jen aplikace
          stažená z obchodu. */}
      <DailyReminder />

      {/*
        Připomínky pro web. V aplikaci z obchodu se schovávají: tam je
        obsluhuje `DailyReminder` přes systém a dvě různá nastavení téže
        věci vedle sebe by si odporovala.
      */}
      {vapidPublicKey && (
        <div className="store-hidden">
          <NotifySettings
            vapidPublicKey={vapidPublicKey}
            initial={{
              mode: user.notifyMode,
              time: user.notifyTime,
              evening: user.notifyEvening,
            }}
          />
        </div>
      )}

      {/* Úplně dole a nenápadně. Je to nevratné, takže sem nikdo nemá
          dojít omylem — ale najít se to musí dát bez psaní na podporu. */}
      <DeleteAccount email={user.email} />
    </section>
  );
}
