"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Hlášení od uživatelů ve správě.
 *
 * Tohle je jediné místo, kde se text dá přečíst — do e-mailu se
 * schválně neposílá, protože je v databázi šifrovaný a schránka
 * šifrovaná není.
 *
 * Vyřízená hlášení zůstávají. Mizí až se smazaným účtem.
 */

export type FeedbackItem = {
  id: string;
  message: string;
  path: string | null;
  locale: string;
  storeApp: boolean;
  email: string | null;
  createdAt: Date;
  done: boolean;
};

export function FeedbackList({ items }: { items: FeedbackItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const formatDateTime = new Intl.DateTimeFormat("cs", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const toggle = async (id: string, done: boolean) => {
    setBusy(id);
    try {
      await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, done }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) {
    return (
      <p className="mt-3 text-sm text-[var(--color-paper-dim)]">
        Zatím nic. To je buď dobře, nebo to nikdo nenašel.
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className={`card p-4 ${item.done ? "opacity-55" : ""}`}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-[var(--color-paper-faint)]">
            <span className="tabular-nums">
              {formatDateTime.format(item.createdAt)}
            </span>
            <span>{item.email ?? "smazaný účet"}</span>
            {item.path && (
              <span className="text-[var(--color-paper-dim)]">{item.path}</span>
            )}
            <span>{item.locale}</span>
            {item.storeApp && <span>z obchodu</span>}
          </div>

          {/* `whitespace-pre-wrap`: lidé píšou odstavce a bez tohohle
              by z hlášení byla jedna slitá věta. */}
          <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-[var(--color-paper)]">
            {item.message}
          </p>

          <button
            type="button"
            onClick={() => toggle(item.id, !item.done)}
            disabled={busy === item.id}
            className="mt-3 text-sm text-[var(--color-paper-faint)] underline-offset-4 hover:text-[var(--color-paper)] hover:underline disabled:opacity-50"
          >
            {item.done ? "Vrátit mezi nová" : "Vyřízeno"}
          </button>
        </li>
      ))}
    </ul>
  );
}
