"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Field, FormError } from "./AuthShell";
import {
  MIN_PASSWORD_LENGTH,
  type AuthErrorKey,
} from "@/lib/auth/validation";

/** Žádost o odkaz pro nastavení nového hesla. */
export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const tError = useTranslations("auth.errors");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale }),
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

  // Potvrzení je stejné, ať účet existuje nebo ne — jinak by šlo
  // tímhle formulářem zjišťovat registrované adresy.
  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="display text-lg">{t("successTitle")}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
            {t("successBody")}
          </p>
        </div>
        <Link href="/login" className="btn-secondary w-full">
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
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

      {error && <FormError>{tError(error)}</FormError>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

/** Nastavení nového hesla podle tokenu z e-mailu. */
export function ResetPasswordForm() {
  const t = useTranslations("auth.reset");
  const tError = useTranslations("auth.errors");
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError("passwordTooShort");
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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

  if (!token) {
    return (
      <div className="space-y-4">
        <FormError>{tError("tokenInvalid")}</FormError>
        <Link href="/forgot-password" className="btn-secondary w-full">
          {t("requestNew")}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[color-mix(in_oklab,var(--color-lime-glow)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_8%,transparent)] p-5">
          <h2 className="display text-lg">{t("successTitle")}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
            {t("successBody")}
          </p>
        </div>
        <Link href="/login" className="btn-primary w-full">
          {t("toLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
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

      {error && <FormError>{tError(error)}</FormError>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
