"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Field, FormError } from "./AuthShell";
import type { AuthErrorKey } from "@/lib/auth/validation";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tError = useTranslations("auth.errors");
  const locale = useLocale();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = params.get("callbackUrl") ?? `/${locale}/app`;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      // NextAuth nerozlišuje důvod schválně — neprozrazujeme,
      // jestli neexistuje účet, nebo nesedí heslo.
      setError("invalidCredentials");
      setLoading(false);
      return;
    }

    // Tvrdý přechod, ať se session propíše do serverových komponent.
    window.location.href = callbackUrl;
  };

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

      <Field
        id="password"
        type="password"
        autoComplete="current-password"
        label={t("passwordLabel")}
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
