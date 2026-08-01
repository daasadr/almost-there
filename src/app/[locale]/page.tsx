import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TreeBackground } from "@/components/TreeBackground";
import { ExampleBreakdown } from "@/components/ExampleBreakdown";

type Step = { step: string; title: string; body: string };
type Feature = { title: string; body: string };

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <HowItWorks />
      <ExampleBreakdown />
      <Features />
      <Pricing />
      <FinalCta />
    </>
  );
}

function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative isolate overflow-hidden">
      <TreeBackground />

      <div className="relative mx-auto max-w-6xl px-5 pb-28 pt-20 sm:px-8 sm:pb-36 sm:pt-28">
        <div className="max-w-2xl">
          <p className="eyebrow">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-lime-glow)]" />
            {t("eyebrow")}
          </p>

          <h1 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">
            {t("title")}
            <br />
            <span className="text-gradient">{t("titleAccent")}</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-[var(--color-paper-dim)]">
            {t("subtitle")}
          </p>

          {/* Dvě rovnocenná CTA vedle sebe — ne každý chce demo (zadání, bod 8) */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/demo" className="btn-primary">
              {t("ctaDemo")}
            </Link>
            <a href="#pricing" className="btn-secondary">
              {t("ctaBuy")}
            </a>
          </div>

          <p className="mt-5 text-sm text-[var(--color-paper-faint)]">
            {t("ctaNote")}
          </p>
        </div>

        <p className="mt-20 max-w-md border-l border-white/10 pl-4 text-sm text-[var(--color-paper-faint)] sm:mt-28">
          {t("trustLine")}
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const t = useTranslations("how");
  const steps = t.raw("steps") as Step[];

  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl reveal">
          <h2 className="display text-4xl sm:text-5xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-[var(--color-paper-dim)]">
            {t("subtitle")}
          </p>
        </div>

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.step}
              className="card card-hover reveal p-7"
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <span className="display text-4xl text-[color-mix(in_oklab,var(--color-lime-glow)_38%,transparent)]">
                {step.step}
              </span>
              <h3 className="display mt-5 text-xl">{step.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Features() {
  const t = useTranslations("features");
  const items = t.raw("items") as Feature[];

  return (
    <section id="features" className="relative py-24 sm:py-32">
      {/* Jemná záře, aby sekce nebyla jen plochý tmavý blok */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 40% at 85% 15%, rgba(139,92,246,0.10), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl reveal">
          <p className="eyebrow">02</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-[var(--color-paper-dim)]">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.title}
              className={`card card-hover reveal p-7 ${
                // První karta je jádro produktu, dostane víc prostoru.
                index === 0 ? "lg:col-span-2" : ""
              }`}
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--color-lime-glow)_30%,transparent)] text-sm font-semibold text-[var(--color-lime-soft)]">
                {index + 1}
              </div>
              <h3 className="display mt-5 text-xl">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const t = useTranslations("pricing");
  const includes = t.raw("includes") as string[];

  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center reveal">
          <p className="eyebrow justify-center">03</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-[var(--color-paper-dim)]">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <div className="card reveal relative overflow-hidden p-8 sm:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(163,230,53,0.16), transparent 70%)",
              }}
            />

            <div className="relative flex flex-wrap items-baseline gap-x-3">
              <span className="display text-5xl sm:text-6xl">{t("price")}</span>
              <span className="text-lg text-[var(--color-paper-dim)]">
                {t("period")}
              </span>
            </div>
            <p className="relative mt-2 text-sm text-[var(--color-paper-faint)]">
              {t("yearlyNote")}
            </p>

            <ul className="relative mt-8 space-y-3.5">
              {includes.map((item) => (
                <li key={item} className="flex gap-3 text-[15px]">
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 fill-none stroke-[var(--color-lime-soft)] stroke-[1.8]"
                  >
                    <path
                      d="M4 10.5 8 14.5 16 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[var(--color-paper-dim)]">{item}</span>
                </li>
              ))}
            </ul>

            <div className="relative mt-9">
              <Link href="/demo" className="btn-primary w-full sm:w-auto">
                {t("cta")}
              </Link>
            </div>
          </div>

          {/* Limit AI musí být vysvětlený transparentně, ne schovaný v ToC */}
          <div className="reveal mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-paper)]">
              {t("limitsTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-paper-faint)]">
              {t("limitsBody")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const t = useTranslations("finalCta");

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="hairline" />
        <div className="mx-auto mt-16 max-w-2xl text-center reveal">
          <h2 className="display text-4xl sm:text-5xl">
            {t("title")}
            <br />
            <span className="text-gradient">{t("subtitle")}</span>
          </h2>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/demo" className="btn-primary">
              {t("ctaDemo")}
            </Link>
            <a href="#pricing" className="btn-secondary">
              {t("ctaBuy")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
