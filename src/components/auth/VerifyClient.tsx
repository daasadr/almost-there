"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FormError } from "./AuthShell";
import type { AuthErrorKey } from "@/lib/auth/validation";

type State =
  | { status: "checking" }
  | { status: "ok" }
  | { status: "failed"; error: AuthErrorKey };

/** Potvrzení adresy po kliknutí na odkaz z e-mailu. */
export function VerifyClient() {
  const t = useTranslations("auth.verify");
  const tError = useTranslations("auth.errors");
  const params = useSearchParams();
  const token = params.get("token");

  const [state, setState] = useState<State>({ status: "checking" });
  // React ve vývoji spouští efekty dvakrát; bez pojistky by druhý běh
  // narazil na už spotřebovaný token a ohlásil chybu.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setState({ status: "failed", error: "tokenInvalid" });
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
          setState({
            status: "failed",
            error: (data?.error as AuthErrorKey) ?? "generic",
          });
          return;
        }

        setState({ status: "ok" });
      } catch {
        setState({ status: "failed", error: "generic" });
      }
    })();
  }, [token]);

  if (state.status === "checking") {
    return (
      <p className="text-[15px] text-[var(--color-paper-dim)]">
        {t("checking")}
      </p>
    );
  }

  if (state.status === "ok") {
    return (
      <div className="space-y-5">
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
    <div className="space-y-5">
      <FormError>{tError(state.error)}</FormError>
      <p className="text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("errorBody")}
      </p>
      <Link href="/login" className="btn-secondary w-full">
        {t("toLogin")}
      </Link>
    </div>
  );
}
