import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { FreeAccountNotice } from "@/components/billing/FreeAccountNotice";
import { MonthCalendar } from "@/components/plan/MonthCalendar";
import { getAccess } from "@/lib/billing/access";
import { getMonthProgress } from "@/lib/goals/checkin";
import { db } from "@/lib/db";
import { todayIso } from "@/lib/plan/calendar";
import { isStoreApp } from "@/lib/store-app";

/**
 * Celý měsíc plnění na jedné stránce.
 *
 * Týdenní proužek nad dnešními úkoly unese sedm dní. Delší běh — kde byla
 * řada a kde díra — se z něj vyčíst nedá, leda listováním po týdnech.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plan.calendar" });
  return {
    title: `${t("title")} — AlmostThere`,
    robots: { index: false, follow: false },
  };
}

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const { hasAccess, revoked } = await getAccess(
    session.user.id,
    session.user.issuedAt,
  );
  if (revoked) redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "plan.calendar" });

  if (!hasAccess) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        <h1 className="display mt-8 text-3xl">{t("title")}</h1>
        <FreeAccountNotice
          locale={locale}
          storeApp={isStoreApp(await headers())}
        />
      </section>
    );
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { timezone: true },
  });

  const { month } = await searchParams;

  // Měsíc z adresy se ověřuje tvarem, ne důvěrou — cizí hodnota by jinak
  // propadla až do výpočtu mřížky a ta by z ní udělala nesmysl.
  const selected = /^\d{4}-(0[1-9]|1[0-2])$/.test(month ?? "")
    ? month!
    : todayIso(user.timezone).slice(0, 7);

  const days = await getMonthProgress(session.user.id, user.timezone, selected);

  return (
    <section className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="display mt-8 text-3xl">{t("title")}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("subtitle")}
      </p>

      <div className="mt-10">
        <MonthCalendar days={days} month={selected} locale={locale} />
      </div>

      <div className="mt-10">
        <Link
          href={`/${locale}/app`}
          className="text-sm text-[var(--color-paper-dim)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
        >
          ← {t("backToToday")}
        </Link>
      </div>
    </section>
  );
}
