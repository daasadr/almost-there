"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

/**
 * Zrušení účtu.
 *
 * Schválně nenápadné a schválně na dvě fáze: nejdřív se rozbalí
 * vysvětlení, teprve pak jde potvrdit. Kdo sem doscrolluje omylem,
 * nesmí být od nevratného kroku na jedno kliknutí.
 *
 * Potvrzuje se opsáním vlastního e-mailu. Zaškrtávátko by člověk
 * odklikl ze zvyku; opsat adresu se ze zvyku nedá.
 */
export function DeleteAccount({ email }: { email: string }) {
  const t = useTranslations("plan.deleteAccount");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches =
    confirm.trim().toLowerCase() === email.trim().toLowerCase();

  const submit = async () => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(t(data.error === "rateLimited" ? "rateLimited" : "failed"));
        return;
      }

      // Účet je pryč, ale přihlášení nosí uživatel v podepsaném tokenu
      // a ten by ho ještě chvíli vodil po stránkách, které už nemají co
      // ukázat. Odhlášení proto hned, ne až se na to přijde.
      await signOut({ callbackUrl: `/${locale}` });
    } catch {
      setError(t("failed"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <section className="mt-8 rounded-2xl border border-white/5 p-6 sm:p-8">
        <h2 className="text-sm font-semibold text-[var(--color-paper)]">
          {t("title")}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-faint)]">
          {t("teaser")}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 text-sm text-[var(--color-paper-faint)] underline underline-offset-4 transition hover:text-[var(--color-paper-dim)]"
        >
          {t("open")}
        </button>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-red-400/25 bg-red-400/[0.03] p-6 sm:p-8">
      <h2 className="display text-lg text-red-200">{t("title")}</h2>

      <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      {/* Co přesně zmizí. Slib „smažeme vaše data" nikomu nic neřekne. */}
      <ul className="mt-4 space-y-1.5 text-sm text-[var(--color-paper-faint)]">
        {(t.raw("items") as string[]).map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden="true">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <label className="mt-6 block">
        <span className="text-sm text-[var(--color-paper-dim)]">
          {t("confirmLabel", { email })}
        </span>
        <input
          type="email"
          value={confirm}
          disabled={busy}
          autoComplete="off"
          onChange={(event) => setConfirm(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] text-[var(--color-paper)] focus:border-red-400/50"
        />
      </label>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={submit}
          disabled={!matches || busy}
          className="rounded-full bg-red-500/90 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? t("deleting") : t("confirm")}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirm("");
            setError(null);
          }}
          disabled={busy}
          className="text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper-dim)] hover:underline"
        >
          {t("cancel")}
        </button>
      </div>
    </section>
  );
}
