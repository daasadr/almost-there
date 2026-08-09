"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Přidělení a odebrání bezplatného přístupu.
 *
 * Rozhraní je česky napevno. Je to nástroj pro provozovatele, ne pro
 * zákazníky — překládat ho do tří jazyků kvůli jednomu člověku by byla
 * práce, kterou nikdo neuvidí.
 */
export function AccessControls({
  userId,
  isComplimentary,
  hasPaidSubscription,
}: {
  userId: string;
  isComplimentary: boolean;
  hasPaidSubscription: boolean;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [until, setUntil] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasPaidSubscription) {
    return (
      <span className="text-xs text-[var(--color-paper-faint)]">
        platí přes Stripe
      </span>
    );
  }

  const send = async (grant: boolean) => {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          grant ? { grant: true, note, until: until || undefined } : { grant: false },
        ),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(MESSAGES[data.error as string] ?? "Nepovedlo se to.");
        setPending(false);
        return;
      }

      setOpen(false);
      setNote("");
      setUntil("");
      setPending(false);
      router.refresh();
    } catch {
      setError("Nepovedlo se to.");
      setPending(false);
    }
  };

  if (isComplimentary) {
    return (
      <div>
        <button
          type="button"
          onClick={() => send(false)}
          disabled={pending}
          className="text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:text-red-300 hover:underline disabled:opacity-50"
        >
          {pending ? "Odebírám…" : "Odebrat přístup"}
        </button>
        {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium transition hover:border-[color-mix(in_oklab,var(--color-lime-glow)_50%,transparent)]"
      >
        Přidělit zdarma
      </button>
    );
  }

  return (
    <div className="min-w-56 rounded-xl border border-white/10 p-3">
      <label className="block text-xs text-[var(--color-paper-faint)]">
        Důvod
        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="tester / výherce / rodina"
          maxLength={200}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-sm text-[var(--color-paper)]"
        />
      </label>

      <label className="mt-2.5 block text-xs text-[var(--color-paper-faint)]">
        Do kdy (nepovinné)
        <input
          type="date"
          value={until}
          onChange={(event) => setUntil(event.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-sm text-[var(--color-paper)]"
        />
      </label>

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => send(true)}
          disabled={pending || !note.trim()}
          className="rounded-full border border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] px-3 py-1 text-xs font-medium text-[var(--color-lime-soft)] disabled:opacity-40"
        >
          {pending ? "Přiděluji…" : "Přidělit"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded-full border border-white/15 px-3 py-1 text-xs text-[var(--color-paper-dim)]"
        >
          Zpět
        </button>
      </div>
    </div>
  );
}

const MESSAGES: Record<string, string> = {
  noteRequired: "Vyplň důvod.",
  hasPaidSubscription: "Účet má placené předplatné ze Stripu.",
  notComplimentary: "Tenhle účet nemá přidělený přístup.",
  notFound: "Účet neexistuje.",
};
