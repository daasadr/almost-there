import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * Co vidí přihlášený člověk, který ještě nemá zaplaceno.
 *
 * Aplikace bez předplatného neumí nic než demo a nemá smysl to zastírat.
 * Špatně je něco jiného: nechat takového člověka narazit na prázdno.
 * Dřív ho stránka s cíli mlčky vyhodila zpátky na dnešek — záložka
 * v menu vypadala jako rozbitá — a na účtu se o předplatném nedozvěděl
 * vůbec nic. Kdo se v aplikaci pohybuje, musí na každé stránce pochopit,
 * proč je prázdná a co s tím.
 *
 * Odtud plyne i to, že nabídka nestojí jen na jednom místě. Dokud není
 * zaplaceno, je to na každé stránce ta nejdůležitější věc — hledat cestu
 * k zaplacení nemá nikdo.
 *
 * V aplikaci z obchodu se nabídka zaplacení nahradí odkazem na demo.
 * Placení mimo obchod v ní nabízet nesmíme, viz lib/store-app.ts.
 */
export async function FreeAccountNotice({
  locale,
  storeApp,
  /** Doplňující věta k tomu, proč je zrovna tahle stránka prázdná. */
  reason,
}: {
  locale: string;
  storeApp: boolean;
  reason?: string;
}) {
  const t = await getTranslations({ locale, namespace: "billing" });

  return (
    <div className="mt-6 rounded-2xl border border-[color-mix(in_oklab,var(--color-lime-glow)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_8%,transparent)] p-5 sm:p-6">
      <h2 className="display text-lg">{t("freeTitle")}</h2>

      {reason && (
        <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper)]">
          {reason}
        </p>
      )}

      <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("freeBody")}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {storeApp ? (
          <Link href={`/${locale}/demo`} className="btn-primary inline-block">
            {t("demoCta")}
          </Link>
        ) : (
          <>
            {/* Samotná nabídka s cenami žije na dnešku. Odsud se na ni
                jen odkazuje, ať je platba pořád na jednom místě. */}
            <Link href={`/${locale}/app`} className="btn-primary inline-block">
              {t("cta")}
            </Link>
            <Link
              href={`/${locale}/demo`}
              className="text-sm text-[var(--color-paper-faint)] underline underline-offset-4 hover:text-[var(--color-paper-dim)]"
            >
              {t("demoCta")}
            </Link>
          </>
        )}
      </div>

      {storeApp && (
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-paper-faint)]">
          {t("freeStoreNote")}
        </p>
      )}
    </div>
  );
}
