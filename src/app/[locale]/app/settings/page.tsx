import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { SettingsForm } from "@/components/plan/SettingsForm";
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
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  // Předvolby jsou dostupné i bez předplatného — jsou to údaje o uživateli,
  // ne funkce produktu, a měnit si je má právo kdykoliv.
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      dailyCapacityMinutes: true,
      reflectionMinutesDay: true,
      restFrequency: true,
      timezone: true,
    },
  });

  const t = await getTranslations({ locale, namespace: "plan.settings" });

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
      <Link
        href={`/${locale}/app`}
        className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
      >
        ← {t("back")}
      </Link>

      <h1 className="display mt-6 text-3xl sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("subtitle")}
      </p>

      <div className="card mt-8 p-6 sm:p-8">
        <SettingsForm initial={user} />
      </div>
    </section>
  );
}
