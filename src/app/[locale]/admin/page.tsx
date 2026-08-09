import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessControls } from "@/components/admin/AccessControls";
import { currentAdmin } from "@/lib/admin/guard";
import {
  complimentaryBudget,
  listUsers,
  USERS_PER_PAGE,
} from "@/lib/admin/users";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Správa — AlmostThere",
  // Do vyhledávačů tahle stránka nepatří, i když je za přihlášením.
  robots: { index: false, follow: false },
};

/**
 * Správa uživatelů. Jen pro provozovatele, jen česky.
 *
 * Nevypisuje nic z obsahu cílů — jen počty a stav předplatného. Cíle bývají
 * osobní a v zásadách zpracování slibujeme, že k nim je přístup omezený.
 */
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  const admin = await currentAdmin();

  // Ne 403: kdo správcem není, se nemá dozvědět ani to, že tahle stránka je.
  if (!admin) notFound();

  const { q = "", page = "1" } = await searchParams;
  const data = await listUsers({ query: q, page: Number.parseInt(page, 10) || 1 });

  const budget = complimentaryBudget(data.totals.paying);
  const formatDate = new Intl.DateTimeFormat("cs", { dateStyle: "medium" });

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="display text-3xl">Správa uživatelů</h1>
        <Link
          href={`/${locale}/app`}
          className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
        >
          Zpět do aplikace
        </Link>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Registrovaných" value={String(data.totals.all)} />
        <Stat label="Platících" value={String(data.totals.paying)} />
        <Stat
          label="Rozdaných zdarma"
          value={`${data.totals.complimentary} z ${budget}`}
          note={`podle pravidla 1 na ${env.complimentaryPerPayingUsers} platících`}
          warn={data.totals.complimentary > budget}
        />
      </dl>

      <form method="get" className="mt-8 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Hledat podle e-mailu nebo jména"
          className="min-w-64 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 py-2.5 text-[15px] text-[var(--color-paper)]"
        />
        <button type="submit" className="btn-primary !px-5 !py-2 text-sm">
          Hledat
        </button>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-[var(--color-paper-faint)]">
            <tr className="border-b border-white/10">
              <th className="py-3 pr-4 font-semibold">Účet</th>
              <th className="py-3 pr-4 font-semibold">Předplatné</th>
              <th className="py-3 pr-4 font-semibold">Cíle</th>
              <th className="py-3 pr-4 font-semibold">Tento měsíc</th>
              <th className="py-3 font-semibold">Přístup</th>
            </tr>
          </thead>

          <tbody>
            {data.rows.map((user) => (
              <tr key={user.id} className="border-b border-white/5 align-top">
                <td className="py-4 pr-4">
                  <span className="block text-[var(--color-paper)]">
                    {user.email}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--color-paper-faint)]">
                    {user.name ?? "bez jména"} ·{" "}
                    {user.authProvider === "GOOGLE" ? "Google" : "heslo"}
                    {!user.isEmailVerified && " · neověřený e-mail"}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--color-paper-faint)]">
                    od {formatDate.format(user.createdAt)}
                  </span>
                </td>

                <td className="py-4 pr-4">
                  <span className="text-[var(--color-paper)]">
                    {STATUS[user.subscriptionStatus] ?? user.subscriptionStatus}
                  </span>
                  {user.subscriptionSource === "COMPLIMENTARY" && (
                    <span className="mt-0.5 block text-xs text-[var(--color-lime-soft)]">
                      zdarma
                      {user.subscriptionNote && ` — ${user.subscriptionNote}`}
                    </span>
                  )}
                  {user.subscriptionEndsAt && (
                    <span className="mt-0.5 block text-xs text-[var(--color-paper-faint)]">
                      do {formatDate.format(user.subscriptionEndsAt)}
                    </span>
                  )}
                </td>

                <td className="py-4 pr-4 tabular-nums text-[var(--color-paper-dim)]">
                  {user.goalCount}
                </td>

                <td className="py-4 pr-4 text-[var(--color-paper-dim)]">
                  <span className="tabular-nums">
                    {user.plansUsed} / {env.monthlyPlanAllowance} plánů
                  </span>
                  <span className="mt-0.5 block text-xs tabular-nums text-[var(--color-paper-faint)]">
                    {user.monthlySpendCzk.toFixed(2)} Kč
                  </span>
                </td>

                <td className="py-4">
                  <AccessControls
                    userId={user.id}
                    isComplimentary={
                      user.subscriptionSource === "COMPLIMENTARY"
                    }
                    hasPaidSubscription={
                      user.subscriptionSource === "STRIPE" ||
                      user.subscriptionSource === "APPLE" ||
                      user.subscriptionSource === "GOOGLE_PLAY"
                    }
                  />
                </td>
              </tr>
            ))}

            {data.rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-[var(--color-paper-faint)]"
                >
                  Nikdo takový tu není.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.pageCount > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm">
          <PageLink
            locale={locale}
            q={q}
            page={data.page - 1}
            disabled={data.page <= 1}
            label="← Předchozí"
          />
          <span className="text-[var(--color-paper-faint)]">
            Strana {data.page} z {data.pageCount} · {data.total} účtů po{" "}
            {USERS_PER_PAGE}
          </span>
          <PageLink
            locale={locale}
            q={q}
            page={data.page + 1}
            disabled={data.page >= data.pageCount}
            label="Další →"
          />
        </nav>
      )}
    </section>
  );
}

const STATUS: Record<string, string> = {
  NONE: "Žádné",
  TRIAL: "Zkušební",
  ACTIVE: "Aktivní",
  PAST_DUE: "Neuhrazeno",
  CANCELED: "Zrušeno",
};

function Stat({
  label,
  value,
  note,
  warn = false,
}: {
  label: string;
  value: string;
  note?: string;
  warn?: boolean;
}) {
  return (
    <div className="card p-5">
      <dt className="text-xs uppercase tracking-wider text-[var(--color-paper-faint)]">
        {label}
      </dt>
      <dd
        className={`display mt-2 text-2xl ${warn ? "text-amber-200" : ""}`}
      >
        {value}
      </dd>
      {note && (
        <p className="mt-1.5 text-xs text-[var(--color-paper-faint)]">{note}</p>
      )}
    </div>
  );
}

function PageLink({
  locale,
  q,
  page,
  disabled,
  label,
}: {
  locale: string;
  q: string;
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return <span className="text-[var(--color-paper-faint)]">{label}</span>;
  }

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  query.set("page", String(page));

  return (
    <Link
      href={`/${locale}/admin?${query}`}
      className="text-[var(--color-paper-dim)] hover:text-[var(--color-paper)]"
    >
      {label}
    </Link>
  );
}
