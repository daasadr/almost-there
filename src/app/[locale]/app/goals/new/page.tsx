import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { GoalForm } from "@/components/plan/GoalForm";
import { getAccess } from "@/lib/billing/access";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plan.form" });
  return { title: `${t("title")} — AlmostThere` };
}

export default async function NewGoalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  // Bez předplatného zpátky na rozcestí, kde je paywall. Kontrola je i v API,
  // tohle je jen proto, aby uživatel nevyplňoval formulář zbytečně.
  const { hasAccess } = await getAccess(session.user.id);
  if (!hasAccess) redirect(`/${locale}/app`);

  const t = await getTranslations({ locale, namespace: "plan.form" });

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
      <Link
        href={`/${locale}/app`}
        className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
      >
        ← {t("cancel")}
      </Link>

      <h1 className="display mt-6 text-3xl sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("subtitle")}
      </p>

      <div className="card mt-8 p-6 sm:p-8">
        <GoalForm />
      </div>
    </section>
  );
}
