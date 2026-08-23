import type { ReactNode } from "react";
import { LogoMark } from "@/components/Logo";

/**
 * Společný rám pro přihlášení, registraci a práci s heslem.
 * Držíme ho oddělený od landing page — tady jde o soustředění na formulář,
 * ne o vizuální efekt.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="relative isolate min-h-[80dvh] overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 15% 0%, rgba(16,185,129,0.13), transparent 70%)," +
            "radial-gradient(45% 40% at 90% 15%, rgba(139,92,246,0.12), transparent 72%)",
        }}
      />

      <div className="relative mx-auto flex max-w-md flex-col justify-center px-5 py-16 sm:py-24">
        <div className="card p-7 sm:p-9">
          <LogoMark className="h-8 w-8" />
          <h1 className="display mt-6 text-2xl sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
              {subtitle}
            </p>
          )}
          <div className="mt-7">{children}</div>
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-[var(--color-paper-dim)]">
            {footer}
          </div>
        )}
      </div>
    </section>
  );
}

/** Textové pole se štítkem — sjednocuje vzhled napříč formuláři. */
export function Field({
  id,
  label,
  hint,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[var(--color-paper)]"
      >
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] disabled:opacity-60"
      />
      {hint && (
        <p className="mt-1.5 text-xs text-[var(--color-paper-faint)]">{hint}</p>
      )}
    </div>
  );
}

/** Chybová hláška formuláře. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
    >
      {children}
    </p>
  );
}

/** Oddělovač mezi přihlášením heslem a přes Google. */
export function Divider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-xs uppercase tracking-wider text-[var(--color-paper-faint)]">
        {label}
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
