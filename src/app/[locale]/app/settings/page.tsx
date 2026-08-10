import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { SettingsForm } from "@/components/plan/SettingsForm";
import { DailyReminder } from "@/components/native/DailyReminder";
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
    },
  });

  const t = await getTranslations({ locale, namespace: "plan.settings" });

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
      <Link
        href={backToGoal ? `/${locale}/app/goals/new` : `/${locale}/app`}
        className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
      >
        ← {backToGoal ? t("backToGoal") : t("back")}
      </Link>

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

      {/* Úplně dole a nenápadně. Je to nevratné, takže sem nikdo nemá
          dojít omylem — ale najít se to musí dát bez psaní na podporu. */}
      <DeleteAccount email={user.email} />
    </section>
  );
}
