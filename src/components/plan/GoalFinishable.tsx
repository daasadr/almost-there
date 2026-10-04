"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { goalHex } from "@/lib/plan/colors";

/**
 * „Vypadá to, že jsi to dotáhla."
 *
 * Tohle je náprava tiché díry na konci cesty. Cíl doběhl, poslední úkol
 * se odškrtl — a aplikace mlčky pokračovala dál. Plný pruh, „8 z 8",
 * stav „běží". Žádné uzavření, žádná oslava, nic. Přitom dotažení je
 * jediná věc, kvůli které celá aplikace existuje.
 *
 * Nabídka existovala, ale jen na stránce cíle. Tam se člověk v posledním
 * týdnu nepodívá, protože odškrtává na dnešku.
 *
 * ── Proč okno, a ne kartička ────────────────────────────────────────
 *
 * Kartička v proudu stránky se dá přejet očima jako všechno ostatní —
 * a přesně to se stalo: dva dotažené cíle týden visely mezi rozdělanými,
 * aniž si toho někdo všiml. Aplikace nemá čekat, až člověku dojde, že
 * došel na konec. Má mu to říct.
 *
 * Otevře se tedy samo a jednou. Zavřít jde klávesou i kliknutím vedle,
 * protože okno, které nejde zavřít, je horší než žádné.
 *
 * ── Proč se ptáme a neuzavíráme sami ────────────────────────────────
 *
 * Jestli člověk svého cíle dosáhl, ví on, ne my podle počtu zaškrtnutých
 * políček. Plán je návrh, ne podmínka. Navíc se při uzavření píše
 * shrnutí přes model a to stojí peníze — spustit to samo by znamenalo
 * platit za rozhodnutí, které jsme neudělali my.
 *
 * ── Proč to vypadá jako oslava ──────────────────────────────────────
 *
 * Protože to oslava je. Všechno ostatní v aplikaci je pracovní; tohle je
 * jediná chvíle, kdy se něco povedlo celé. Kdyby to vypadalo jako další
 * upozornění, přejde se to jako upozornění.
 */
/**
 * Výchozí termín rozšíření: za měsíc.
 *
 * Dost na to, aby se dalo něco dotáhnout, a málo na to, aby se z toho
 * stal další dlouhý cíl. Uživatel to kdykoliv změní.
 */
function defaultExtension(): string {
  const date = new Date(Date.now() + 30 * 86_400_000);
  return date.toISOString().slice(0, 10);
}

export function GoalFinishable({
  goals,
}: {
  goals: {
    id: string;
    title: string;
    color: string;
    pending: number;
    overdue: boolean;
    /** Závěrečná zkouška a odměna. Prázdné u starších cílů. */
    challenge: string | null;
    reward: string | null;
  }[];
}) {
  const t = useTranslations("plan.finish");
  const router = useRouter();

  const [working, setWorking] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  /** Skryté napořád pro tenhle pohled — „teď ne" se nemá ptát znovu hned. */
  const [dismissed, setDismissed] = useState<string[]>([]);

  /**
   * Rozšíření místo uzavření.
   *
   * Nabízí se **před** uzavřením, ne po něm, a je to schválně. Rozšířit
   * uzavřený cíl by znamenalo vzít zpátky jeho dotažení a z hotové věci
   * udělat zase rozdělanou — i s oslavou, která už proběhla. Tady, než
   * se cokoliv uzavře, to nic nebere.
   *
   * Co míří jinam, je navazující cíl. Ten se nabízí až po oslavě, na
   * stránce dotaženého cíle, protože ten původní nechává být.
   */
  const [extending, setExtending] = useState(false);
  const [addition, setAddition] = useState("");
  const [extendTo, setExtendTo] = useState(defaultExtension());

  const finish = async (id: string) => {
    setWorking(id);
    setFailed(false);

    try {
      const response = await fetch(`/api/goals/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!response.ok) throw new Error("failed");

      // Shrnutí se píše na serveru, takže po návratu už je na stránce
      // dotažených cílů co číst.
      dialog.current?.close();
      router.push(`/app/goals/${id}/done`);
    } catch {
      setFailed(true);
      setWorking(null);
    }
  };

  const extend = async (id: string) => {
    setWorking(id);
    setFailed(false);

    try {
      const response = await fetch(`/api/goals/${id}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "extend", steer: addition, extendTo }),
      });
      if (!response.ok) throw new Error("failed");

      dialog.current?.close();
      // Zbytek plánu se dopsal, takže dnešek vypadá jinak než před chvílí.
      router.refresh();
    } catch {
      setFailed(true);
      setWorking(null);
    }
  };

  const visible = goals.filter((goal) => !dismissed.includes(goal.id));
  const first = visible[0];

  const dialog = useRef<HTMLDialogElement>(null);

  /*
   * Otevře se samo, jakmile je co nabídnout.
   *
   * `showModal` dává zdarma tři věci, které by se jinak psaly ručně
   * a špatně: past na klávesu Tab, zavření Escapem a podklad, přes
   * který se nedá kliknout.
   */
  useEffect(() => {
    if (first && !dialog.current?.open) dialog.current?.showModal();
  }, [first]);

  if (!first) return null;

  return (
    <dialog
      ref={dialog}
      onClose={() => setDismissed((list) => [...list, first.id])}
      onClick={(event) => {
        // Kliknutí mimo obsah zavírá. Terč je samo `dialog`, protože
        // vnitřek zachytí událost dřív.
        if (event.target === dialog.current) dialog.current?.close();
      }}
      className="max-w-lg rounded-2xl border border-edge bg-[var(--color-ink-900)] p-0 text-[var(--color-paper)] backdrop:bg-black/60"
    >
      {[first].map((goal) => (
        <div
          key={goal.id}
          style={{ borderLeftColor: goalHex(goal.color) }}
          className="border-l-[3px] p-6 sm:p-7"
        >
          <p className="text-xs uppercase tracking-wider text-[var(--color-lime-soft)]">
            {t("eyebrow")}
          </p>

          <h3 className="display mt-2 text-xl">
            {t("title", { goal: goal.title })}
          </h3>

          <p className="mt-2 text-base leading-relaxed text-[var(--color-paper-dim)]">
            {/* Tři různé situace, tři různé věty. „Zbývá pět úkolů" a
                „máš hotovo do jednoho" si zaslouží jiné oslovení — a kdo
                má termín za sebou, potřebuje slyšet ještě něco jiného. */}
            {goal.pending === 0
              ? t("bodyClean")
              : t("bodyPending", { count: goal.pending })}
            {goal.overdue && ` ${t("bodyOverdue")}`}
          </p>

          {/*
            Poslední otázka se ptá na zkoušku, ne na pocit.

            „Máš to hotové?" si každý vyloží po svém a odpoví se na to
            podle nálady toho dne. Zkouška je jedna konkrétní věc, která
            se buď stala, nebo nestala — a právě proto se na ni ptáme
            tady, ve chvíli, kdy se cíl uzavírá.

            Odměna visí hned pod ní. Je to to jediné místo v aplikaci,
            kde má smysl ji připomenout: člověk právě váhá, jestli je
            konec, a tohle je druhá polovina té dohody.
          */}
          {!extending && goal.challenge && (
            <div className="mt-5 rounded-xl border border-edge bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
                {t("challengeLabel")}
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-[var(--color-paper)]">
                {goal.challenge}
              </p>
            </div>
          )}

          {!extending && goal.reward && (
            <p className="mt-4 text-base leading-relaxed text-[var(--color-paper-dim)]">
              {t("rewardWaiting")}{" "}
              <span style={{ color: goalHex(goal.color) }}>{goal.reward}</span>
            </p>
          )}

          {failed && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            >
              {t("failed")}
            </p>
          )}

          {/*
            Rozšíření.

            Třetí cesta mezi „mám hotovo" a „ještě ne": cíl je u konce,
            ale ne tak, jak si ho člověk představoval. Termín se posune
            a zbytek plánu se dopíše podle toho, co ještě chce dotáhnout.
          */}
          {extending && (
            <div className="mt-5 rounded-xl border border-edge bg-surface p-4">
              <label
                htmlFor="finish-addition"
                className="block text-sm font-medium"
              >
                {t("extendLabel")}
              </label>
              <textarea
                id="finish-addition"
                value={addition}
                onChange={(event) => setAddition(event.target.value)}
                rows={3}
                placeholder={t("extendPlaceholder")}
                className="mt-2 w-full rounded-xl border border-edge bg-surface px-3.5 py-2.5 text-base text-[var(--color-paper)]"
              />

              <label
                htmlFor="finish-until"
                className="mt-4 block text-sm font-medium"
              >
                {t("extendUntil")}
              </label>
              <input
                id="finish-until"
                type="date"
                value={extendTo}
                onChange={(event) => setExtendTo(event.target.value)}
                className="mt-2 rounded-xl border border-edge bg-surface px-3.5 py-2.5 text-base text-[var(--color-paper)]"
              />
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            {extending ? (
              <button
                type="button"
                onClick={() => void extend(goal.id)}
                // Dva řádky textu jsou málo na to, aby z toho vznikl plán.
                disabled={working !== null || addition.trim().length < 10}
                className="btn-primary !px-5 !py-2.5 disabled:opacity-60"
              >
                {working === goal.id ? t("extending") : t("extendConfirm")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void finish(goal.id)}
                disabled={working !== null}
                className="btn-primary !px-5 !py-2.5 disabled:opacity-60"
              >
                {working === goal.id ? t("finishing") : t("finish")}
              </button>
            )}

            {!extending && (
              <button
                type="button"
                onClick={() => setExtending(true)}
                className="text-sm text-[var(--color-paper-dim)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline"
              >
                {t("extend")}
              </button>
            )}

            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="text-sm text-[var(--color-paper-faint)] hover:text-[var(--color-paper)]"
            >
              {t("later")}
            </button>
          </div>
        </div>
      ))}
    </dialog>
  );
}
