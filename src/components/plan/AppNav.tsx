"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Přepínač mezi třemi částmi aplikace.
 *
 * Doteď byl dnešek, seznam cílů i účet na jedné dlouhé stránce. Míchalo
 * se tím to, co člověk řeší každé ráno, s tím, na co se podívá jednou
 * za týden, a s tím, co otevře třikrát za rok. Kdo chtěl vidět postup
 * u cílů, musel odscrollovat přes celý denní plán — a když tam dojel,
 * působilo to, jako by tam ten seznam ani neměl být.
 *
 * Rozdělení na dnešek, cíle a účet je struktura, kterou lidé znají
 * z jiných aplikací. Nepřekvapí je a nemusí ji zkoumat.
 */

const TABS = [
  { href: "/app", key: "today" },
  { href: "/app/goals", key: "goals" },
  { href: "/app/account", key: "account" },
] as const;

export function AppNav() {
  const t = useTranslations("plan.nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("sections")}
      className="flex gap-1 rounded-full border border-edge bg-surface p-1"
    >
      {TABS.map((tab) => {
        // Detail cíle i zakládání nového patří pod „Cíle“ — jinak by se
        // při práci s cílem nezvýraznilo nic a člověk by nevěděl, kde je.
        // Kalendář je pohled na denní plnění, takže patří pod „Dnešek“ —
        // jinak by na něm nesvítilo nic a člověk by nevěděl, kde je.
        const active =
          tab.href === "/app"
            ? pathname === "/app" || pathname === "/app/calendar"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            // `items-center` je tu kvůli zalomení: „Můj účet“ se na úzkém
            // displeji nevejde na řádek a vytáhne celou lištu na dvě výšky.
            // Ostatní dvě tlačítka se natáhnou s ní, ale jejich jednořádkový
            // text by bez tohohle zůstal nahoře a lišta by vypadala rozhozeně.
            className={`flex flex-1 items-center justify-center rounded-full px-4 py-2 text-center text-sm transition ${
              active
                ? "bg-[color-mix(in_oklab,var(--color-lime-glow)_14%,transparent)] font-medium text-[var(--color-lime-soft)]"
                : "text-[var(--color-paper-dim)] hover:text-[var(--color-paper)]"
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
