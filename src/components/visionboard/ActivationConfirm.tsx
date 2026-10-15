"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  confirmActivation,
  type ConfirmState,
} from "@/app/[locale]/visionboard/activate/actions";

/**
 * Potvrzení aktivace a předání kódu do aplikace.
 *
 * Kód se nikam nepřesměrovává skrz adresu naší stránky. Vrací ho
 * serverová akce a vykreslí se rovnou tady — kdyby šel přes
 * `?code=…`, zůstal by v historii prohlížeče a v logu nginxu, a to
 * jsou dvě místa navíc, kde nemá co dělat.
 *
 * Do aplikace se skáče odkazem `visionboard://activate`. Cíl je pevný
 * řetězec v kódu; z parametrů se bere jen `state`, a ten přichází
 * ověřený ze serveru.
 */
export function ActivationConfirm() {
  const t = useTranslations("visionboard.activate");

  const [state, submit, pending] = useActionState<ConfirmState>(
    confirmActivation,
    { status: "idle" },
  );

  if (state.status === "done") {
    return <Handoff code={state.code} state={state.state} />;
  }

  return (
    <form action={submit} className="mt-7">
      <button
        type="submit"
        disabled={pending}
        className="btn-primary !px-6 !py-3 disabled:opacity-60"
      >
        {pending ? t("confirming") : t("confirm")}
      </button>

      {state.status === "failed" && (
        <p role="alert" className="mt-4 text-sm text-[var(--color-danger)]">
          {t(`failures.${state.reason}`)}
        </p>
      )}
    </form>
  );
}

function Handoff({ code, state }: { code: string; state: string }) {
  const t = useTranslations("visionboard.activate");

  const target = `visionboard://activate?code=${code}&state=${encodeURIComponent(state)}`;

  /*
   * Jeden pokus otevřít aplikaci sám.
   *
   * Prohlížeče se u cizího schématu ptají a některé automatický pokus
   * potlačí úplně. Proto je pod tím tlačítko i vypsaný kód k opsání —
   * tohle je zrychlení pro ten případ, kdy to vyjde, ne jediná cesta.
   */
  useEffect(() => {
    window.location.href = target;
  }, [target]);

  return (
    <div className="mt-8">
      <p className="text-base leading-relaxed text-[var(--color-paper)]">
        {t("openedBody")}
      </p>

      <a href={target} className="btn-primary mt-5 inline-flex !px-6 !py-3">
        {t("open")}
      </a>

      <div className="mt-9 rounded-2xl border border-edge p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
          {t("codeLabel")}
        </p>
        {/* Rozestupy a pevná šířka znaků: kód se opisuje, často z
            telefonu do počítače, a tohle je rozdíl mezi „přečtu" a
            „musím si přiblížit". */}
        <p className="display mt-3 text-3xl tracking-[0.15em] tabular-nums text-[var(--color-lime-soft)]">
          {formatCode(code)}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-paper-dim)]">
          {t("codeNote")}
        </p>
      </div>
    </div>
  );
}

/** `ABCDEFGHJKMN` → `ABCD-EFGH-JKMN`. Tatáž úprava jako na serveru. */
function formatCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}
