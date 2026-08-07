"use client";

import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";

export function SignOutButton({ label }: { label: string }) {
  const locale = useLocale();

  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: `/${locale}` })}
      className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-[var(--color-paper-dim)] transition hover:border-white/30 hover:text-[var(--color-paper)]"
    >
      {label}
    </button>
  );
}
