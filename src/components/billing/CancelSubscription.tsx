"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";

/**
 * Výpověď předplatného.
 *
 * Bez otázek typu „opravdu chcete odejít?“ a bez nabídek slevy. Kdo chce
 * skončit, má skončit — a je slušné mu rovnou říct, do kdy má zaplaceno
 * a že o nic nepřijde.
 */
export function CancelSubscription({
  endsAt,
  cancelAtPeriodEnd,
}: {
  /** Konec zaplaceného období. */
  endsAt: string | null;
  cancelAtPeriodEnd: boolean;
}) {
  const t = useTranslations("billing.cancel");
  const format = useFormatter();
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const send = async (cancel: boolean) => {
    setPending(true);
    setError(false);

    try {
      const response = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel }),
      });
      if (!response.ok) throw new Error("failed");

      setConfirming(false);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  const until = endsAt
    ? format.dateTime(new Date(endsAt), { dateStyle: "long" })
    : null;

  if (cancelAtPeriodEnd) {
    return (
      <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
        <p className="text-sm leading-relaxed text-amber-100/85">
          {until ? t("endingOn", { date: until }) : t("ending")}
        </p>
        <button
          type="button"
          onClick={() => send(false)}
          disabled={pending}
          className="mt-3 text-sm font-medium text-[var(--color-lime-soft)] underline-offset-4 hover:underline disabled:opacity-50"
        >
          {pending ? t("working") : t("resume")}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-200">
            {t("failed")}
          </p>
        )}
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
      >
        {t("cancel")}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {until ? t("confirmUntil", { date: until }) : t("confirm")}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-200">
          {t("failed")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => send(true)}
          disabled={pending}
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-[var(--color-paper)] transition hover:border-white/40 disabled:opacity-50"
        >
          {pending ? t("working") : t("confirmYes")}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-[var(--color-paper-dim)]"
        >
          {t("keep")}
        </button>
      </div>
    </div>
  );
}
