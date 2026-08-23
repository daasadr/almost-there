"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * „Dnes nemůžu.“
 *
 * Úkol se nevyměňuje ani negeneruje nový — zaplatit zkoušku pořád musíš,
 * jen ne dnes. Jde o tentýž úkol v jiný den.
 *
 * Nabídka je schválně krátká. Zítřek pokryje většinu případů jedním
 * kliknutím; datum je pro ty, kdo vědí, kdy to půjde; „nevím kdy“ je pro
 * ty, kdo to nevědí, a je lepší než nechat úkol propadnout. Důvod je
 * nepovinný a nikam se hned neposílá — uloží se a použije až při
 * nejbližším přeplánování, kde má váhu.
 *
 * Rozbaluje se pod úkolem místo vyskakovacího okna: na mobilu se s ním
 * lépe pracuje a nemusí řešit, kam skočí pozornost po zavření.
 */

type Alternative = {
  id: string;
  title: string;
  estimatedMinutes: number | null;
  date: string;
};

/** Dnešek v místním čase, ve tvaru pro API. */
function todayIsoLocal(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Datum o den dál v místním čase, ve tvaru pro `input[type=date]`. */
function tomorrowIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function DeferTask({
  taskId,
  /**
   * Kde tlačítko stojí. V denním seznamu je to samostatný prvek vedle
   * úkolu, mezi nedodělky se řadí k „mám hotovo" a „nechat být" a musí
   * vypadat jako ony — jinak by vypadalo jako důležitější volba.
   */
  variant = "pill",
}: {
  taskId: string;
  variant?: "pill" | "link";
}) {
  const t = useTranslations("plan.defer");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(tomorrowIso);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  /**
   * Co jiného se dá udělat místo odloženého úkolu.
   *
   * Prázdný den vypadá jako selhání, i když člověk udělal to jediné
   * poctivé, co udělat mohl. Server nabídne úkoly z nejbližších dnů
   * téhož cíle — a jen tehdy, když na dnešek opravdu nic jiného nezbývá.
   */
  const [alternatives, setAlternatives] = useState<Alternative[] | null>(null);

  const defer = async (value: string | null) => {
    setPending(true);
    setError(false);

    try {
      const response = await fetch(`/api/tasks/${taskId}/defer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: value, reason }),
      });
      if (!response.ok) throw new Error("defer failed");

      const data = (await response.json()) as { alternatives?: Alternative[] };
      setReason("");

      // Když je co nabídnout, panel zůstane otevřený s nabídkou. Jinak se
      // zavře — bez zbytečného kroku navíc.
      if (data.alternatives?.length) {
        setAlternatives(data.alternatives);
      } else {
        setOpen(false);
      }

      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  const pullForward = async (id: string) => {
    setPending(true);
    try {
      const response = await fetch(`/api/tasks/${id}/defer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayIsoLocal() }),
      });
      if (response.ok) {
        setOpen(false);
        setAlternatives(null);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("open")}
        aria-label={t("open")}
        className={
          variant === "link"
            ? "text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
            : "mr-3 mt-3 shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-xs text-[var(--color-paper-faint)] transition hover:border-white/25 hover:text-[var(--color-paper-dim)]"
        }
      >
        {t("short")}
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl border border-white/10 bg-black/20 p-4 ${
        variant === "link" ? "mt-3 w-full" : "mx-4 mb-4"
      }`}
    >
      {alternatives ? (
        <>
          <p className="text-sm font-medium text-[var(--color-paper)]">
            {t("altTitle")}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
            {t("altBody")}
          </p>

          <ul className="mt-4 space-y-2">
            {alternatives.map((alternative) => (
              <li
                key={alternative.id}
                className="rounded-lg border border-white/10 p-3"
              >
                <p className="text-sm leading-snug text-[var(--color-paper)]">
                  {alternative.title}
                </p>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void pullForward(alternative.id)}
                  className="mt-2 text-xs font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {t("altTake")}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setAlternatives(null);
            }}
            disabled={pending}
            className="mt-4 text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:underline"
          >
            {t("altSkip")}
          </button>
        </>
      ) : (
        <>
      <p className="text-sm font-medium text-[var(--color-paper)]">
        {t("title")}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
        {t("body")}
      </p>

      <label className="mt-4 block">
        <span className="text-xs text-[var(--color-paper-dim)]">
          {t("reasonLabel")}
        </span>
        <textarea
          value={reason}
          disabled={pending}
          rows={2}
          maxLength={500}
          placeholder={t("reasonPlaceholder")}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm leading-relaxed text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)] focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)]"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void defer(tomorrowIso())}
          className="rounded-full border border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-lime-soft)] transition hover:bg-[color-mix(in_oklab,var(--color-lime-glow)_8%,transparent)] disabled:opacity-50"
        >
          {t("tomorrow")}
        </button>

        <input
          type="date"
          value={date}
          disabled={pending}
          min={tomorrowIso()}
          onChange={(event) => setDate(event.target.value)}
          className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-[var(--color-paper)]"
        />
        <button
          type="button"
          disabled={pending || !date}
          onClick={() => void defer(date)}
          className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-[var(--color-paper-dim)] transition hover:border-white/30 hover:text-[var(--color-paper)] disabled:opacity-50"
        >
          {t("onDate")}
        </button>

        {/* Bez data. Lepší než nechat úkol propadnout — a hlavně lepší
            než ho odškrtnout nesplněný. */}
        <button
          type="button"
          disabled={pending}
          onClick={() => void defer(null)}
          className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-[var(--color-paper-dim)] transition hover:border-white/30 hover:text-[var(--color-paper)] disabled:opacity-50"
        >
          {t("someday")}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-300">{t("failed")}</p>}

      <button
        type="button"
        onClick={() => setOpen(false)}
        disabled={pending}
        className="mt-3 text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:underline"
      >
        {t("cancel")}
      </button>
        </>
      )}
    </div>
  );
}
