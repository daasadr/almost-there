import { db } from "@/lib/db";

/**
 * Stav rozesílání oznámení.
 *
 * Vzniklo z otázky, na kterou se třikrát po sobě nedalo odpovědět:
 * „proč mi nepřišla ranní myšlenka?" Odpovědi jsou tři a každá vede
 * jinam — neběží úloha, neodešlo to konkrétnímu zařízení, nebo odešlo
 * a nedoručilo se. Bez záznamu vypadají všechny tři stejně.
 *
 * Nedá se z toho poznat, jestli oznámení doopravdy vyskočilo na
 * obrazovce; to nám poštovní služba prohlížeče neřekne. Ale poznat, kde
 * hledat, se z toho dá — a to je celý účel.
 *
 * Aktuální čas přichází zvenčí, ne z `Date.now()` uvnitř. Čtení hodin
 * při vykreslování je nečistá operace a výjimka z toho pravidla platí
 * jen pro stránky — ty se vykreslí jednou za požadavek. Komponenta se
 * o cizí výjimku opírat nemá.
 */

/** Po jaké době bez běhu je jasné, že se úloha nespouští. */
const STALE_MINUTES = 20;

function ago(date: Date, now: number): string {
  const minutes = Math.round((now - date.getTime()) / 60_000);
  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `před ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `před ${hours} h`;
  return `před ${Math.round(hours / 24)} dny`;
}

export async function DeliveryHealth({ now }: { now: number }) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);

  const [cron, devices, sentToday, withError] = await Promise.all([
    db.cronRun.findUnique({ where: { job: "notify" } }),
    db.pushSubscription.count(),
    db.pushSubscription.count({ where: { lastSentAt: { gte: midnight } } }),
    db.pushSubscription.findMany({
      where: { lastError: { not: null } },
      orderBy: { lastSeenAt: "desc" },
      take: 5,
      select: { id: true, lastError: true },
    }),
  ]);

  const stale = !cron || now - cron.ranAt.getTime() > STALE_MINUTES * 60_000;

  return (
    <section className="mt-14">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
        Rozesílání oznámení
      </h2>

      <div
        className={`mt-3 rounded-xl border p-4 text-sm ${
          stale ? "border-red-400/30 bg-red-400/5" : "border-edge bg-surface"
        }`}
      >
        {cron ? (
          <p className={stale ? "text-red-200" : "text-[var(--color-paper)]"}>
            Úloha běžela <strong>{ago(cron.ranAt, now)}</strong>
            {cron.note && (
              <span className="text-[var(--color-paper-dim)]">
                {" "}
                — {cron.note}
              </span>
            )}
            {stale && (
              <span className="mt-1 block text-xs">
                Měla by běžet každých pár minut. Zkontroluj{" "}
                <code>crontab -l</code> na serveru.
              </span>
            )}
          </p>
        ) : (
          <p className="text-red-200">
            Úloha zatím neproběhla ani jednou. Buď není v <code>crontab</code>,
            nebo se nedovolá — zkus ji spustit ručně a podívej se, co odpoví.
          </p>
        )}

        <p className="mt-2 text-[var(--color-paper-dim)]">
          Přihlášených zařízení: <strong>{devices}</strong> · dnes odesláno na{" "}
          <strong>{sentToday}</strong>
        </p>

        {/* „Odesláno" znamená, že zásilku přijala poštovní služba
            prohlížeče. Doručení na obrazovku už nevidíme — ale když je
            tohle číslo nenulové a uživateli nic nepřišlo, hledá se
            u něj, ne u nás. */}
        {withError.length > 0 && (
          <div className="mt-3 border-t border-edge-faint pt-3">
            <p className="text-xs text-[var(--color-paper-faint)]">
              Zařízení, kterým poslední odeslání selhalo:
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-[var(--color-paper-dim)]">
              {withError.map((device) => (
                <li key={device.id}>{device.lastError}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
