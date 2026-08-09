"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Field, FormError } from "./AuthShell";
import {
  MIN_PASSWORD_LENGTH,
  validateRegister,
  type AuthErrorKey,
} from "@/lib/auth/validation";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const tError = useTranslations("auth.errors");
  const locale = useLocale();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const problem = validateRegister({ name, email, password, consent });
    if (problem) return setError(problem);

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          consent,
          locale,
          // Ať se nový účet netrefí do pražského času jen proto, že je
          // výchozí. Plán se podle pásma rozhoduje, kdy začíná nový den.
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError((data?.error as AuthErrorKey) ?? "generic");
        setLoading(false);
        return;
      }

      setDone(true);
    } catch {
      setError("generic");
      setLoading(false);
    }
  };

  // Po registraci nepřihlašujeme — uživatel musí nejdřív potvrdit adresu.
  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[color-mix(in_oklab,var(--color-lime-glow)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_8%,transparent)] p-5">
          <h2 className="display text-lg">{t("successTitle")}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
            {t("successBody", { email: email.trim() })}
          </p>
        </div>
        <Link href="/login" className="btn-secondary w-full">
          {t("toLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field
        id="name"
        type="text"
        autoComplete="name"
        label={t("nameLabel")}
        value={name}
        disabled={loading}
        onChange={(event) => {
          setName(event.target.value);
          if (error) setError(null);
        }}
      />

      <Field
        id="email"
        type="email"
        autoComplete="email"
        label={t("emailLabel")}
        value={email}
        disabled={loading}
        onChange={(event) => {
          setEmail(event.target.value);
          if (error) setError(null);
        }}
      />

      <Field
        id="password"
        type="password"
        autoComplete="new-password"
        label={t("passwordLabel")}
        hint={t("passwordHint", { min: MIN_PASSWORD_LENGTH })}
        value={password}
        disabled={loading}
        onChange={(event) => {
          setPassword(event.target.value);
          if (error) setError(null);
        }}
      />

      {/* Povinný souhlas — bez zaškrtnutí nelze pokračovat (zadání, bod 13) */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={consent}
          disabled={loading}
          onChange={(event) => {
            setConsent(event.target.checked);
            if (error) setError(null);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-lime-glow)]"
        />
        <span className="text-sm leading-relaxed text-[var(--color-paper-dim)]">
          {t.rich("consentLabel", {
            terms: (chunks) => (
              <Link
                href="/terms"
                target="_blank"
                className="underline underline-offset-2 hover:text-[var(--color-paper)]"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privacy"
                target="_blank"
                className="underline underline-offset-2 hover:text-[var(--color-paper)]"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>

      {error && <FormError>{tError(error)}</FormError>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
