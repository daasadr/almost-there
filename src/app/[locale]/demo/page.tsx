import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo/metadata";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { DemoExperience } from "@/components/demo/DemoExperience";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "demo" });
  return {
    title: `${t("title")} — AlmostThere`,
    alternates: localeAlternates(locale, "/demo"),
  };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DemoContent />;
}

function DemoContent() {
  const t = useTranslations("demo");

  return (
    <section className="relative isolate min-h-[80dvh] overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 20% 0%, rgba(16,185,129,0.14), transparent 70%)," +
            "radial-gradient(50% 40% at 90% 20%, rgba(139,92,246,0.12), transparent 72%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="eyebrow">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-lime-glow)]" />
          {t("badge")}
        </p>
        <h1 className="display mt-5 text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-xl text-lg text-[var(--color-paper-dim)]">
          {t("subtitle")}
        </p>

        <div className="mt-10">
          <DemoExperience />
        </div>
      </div>
    </section>
  );
}
