"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { GenerationProgress } from "@/components/demo/GenerationProgress";
import { planErrorKey } from "@/lib/plan/errors";
import { useSession } from "next-auth/react";
import { clearGoalDraft, loadGoalDraft, saveGoalDraft } from "@/lib/goal-draft";
import { goalColors, goalHex, type GoalColor } from "@/lib/plan/colors";
import Link from "next/link";
import {
  defaultTargetDate,
  maxTargetDate,
  minTargetDate,
  validateGoalTitle,
  validateTargetDate,
  MAX_GOAL_DETAIL,
  MAX_GOAL_TITLE,
} from "@/lib/demo-validation";

/**
 * Založení cíle. Validace je stejná jako v demu a běží i na serveru —
 * tady jen proto, aby uživatel nečekal na kolečko kvůli prázdnému poli.
 */
const importanceLevels = [1, 2, 3, 4, 5] as const;

/*
 * Zadání cíle je dlouhé a člověk kvůli němu často odskočí — do nastavení
 * pro denní kapacitu, do kalendáře pro termín, nebo na mobilu úplně jinam.
 * Když se pak vrátí a najde prázdný formulář, podruhé už ho vyplňovat
 * nebude. Rozepsané se proto průběžně ukládá.
 *
 * Kam a s jakými pojistkami řeší lib/goal-draft.ts.
 */

export function GoalForm({
  /**
   * Barvy, které už mají běžící cíle, a názvy těch cílů.
   *
   * Nezakazují se — když někdo chce dva zelené cíle, je to jeho věc.
   * Ale u pěti souběžných cílů si nikdo nepamatuje, která barva je
   * volná, a náhodná shoda pak maří to jediné, k čemu barvy jsou:
   * poznat v denním seznamu na první pohled, co ke komu patří.
   */
  usedColors = {},
  planning,
}: {
  /**
   * Předvolby, ze kterých se plán staví. Nastavují se jinde, ale musí
   * být vidět tady — jsou to nejsilnější vstupy do výsledku a uživatel
   * o nich jinak neví.
   */
  planning: {
    dailyCapacityMinutes: number;
    restFrequency: string;
    reflectionMinutesDay: number;
  };
  /** Barva → název cíle, který ji už používá. */
  usedColors?: Record<string, string>;
}) {
  const t = useTranslations("plan.form");
  const tError = useTranslations("plan.errors");
  const tSettings = useTranslations("plan.settings");
  const router = useRouter();
  const locale = useLocale();

  // Ke konceptu se připisuje, komu patří — na sdíleném zařízení se cizí
  // rozepsaný cíl ukázat nesmí. Viz lib/goal-draft.ts.
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [targetDate, setTargetDate] = useState(defaultTargetDate());
  const [importance, setImportance] = useState(3);
  const [color, setColor] = useState<GoalColor>("lime");
  /**
   * Obrázky vybrané ještě před založením cíle.
   *
   * Nahrát je dřív nejde — patří k cíli a ten zatím neexistuje. Drží se
   * proto v paměti prohlížeče a odešlou se hned, jak cíl vznikne.
   * Uživatel je hledá tady, protože sem patří celé zadání; že je server
   * potřebuje až o krok později, není jeho starost.
   */
  const [images, setImages] = useState<File[]>([]);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Otevřená otázka „hotovo?“ před samotným založením. */
  const [confirming, setConfirming] = useState(false);

  // Dokud se rozdělaný cíl nenačte, nesmí se nic ukládat — jinak by
  // prázdný formulář při prvním vykreslení přepsal to, co se má obnovit.
  const restored = useRef(false);

  useEffect(() => {
    // Bez známého uživatele se koncept nenačítá ani neukládá — nešlo by
    // ověřit, komu patří.
    if (!userId) return;

    const draft = loadGoalDraft(userId);
    if (draft) {
      if (typeof draft.title === "string") setTitle(draft.title);
      if (typeof draft.description === "string") setDescription(draft.description);
      if (typeof draft.startingPoint === "string") setStartingPoint(draft.startingPoint);
      if (typeof draft.targetDate === "string") setTargetDate(draft.targetDate);
      if (typeof draft.importance === "number") setImportance(draft.importance);
      if (typeof draft.color === "string") setColor(draft.color as GoalColor);
    }
    restored.current = true;
  }, [userId]);

  /**
   * Rozepsané zadání se drží v `localStorage`, ne v `sessionStorage`.
   *
   * Na mobilu je to zásadní rozdíl. Android aplikaci odloženou na pozadí
   * běžně zruší, aby uvolnil paměť, a po návratu ji spustí znovu —
   * `sessionStorage` je v tu chvíli prázdné a s ním i všechno, co měl
   * člověk napsané. Kdo odskočil na zprávu a vrátil se, našel prázdný
   * formulář.
   *
   * `localStorage` restart přežije. Zadání se drží, dokud se cíl nezaloží
   * nebo dokud ho uživatel sám nezahodí.
   */
  useEffect(() => {
    if (!restored.current || !userId) return;
    saveGoalDraft(userId, {
      title,
      description,
      startingPoint,
      targetDate,
      importance,
      color,
    });
  }, [userId, title, description, startingPoint, targetDate, importance, color]);

  /**
   * Enter v jednořádkovém poli nesmí odeslat formulář.
   *
   * Prohlížeč to dělá sám, když má formulář jediné odesílací tlačítko.
   * U tohohle formuláře to bylo špatně: člověk psal název cíle, chtěl
   * odřádkovat — nebo trefil klávesu omylem — a cíl se rovnou založil
   * i s rozepsaným zbytkem. Založení stojí čas i peníze za rozfázování
   * a vrátit se nedá.
   *
   * V textových polích Enter zůstává, tam odřádkovat opravdu chce.
   * Tlačítka si Enter obsluhují sama.
   */
  const guardEnter = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter") return;
    const tag = (event.target as HTMLElement).tagName;
    if (tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return;
    event.preventDefault();
  };

  /** Zahodí rozepsané zadání i to, co je uložené. */
  const discard = () => {
    if (!window.confirm(t("discardConfirm"))) return;
    clearGoalDraft();
    router.push(`/${locale}/app/goals`);
  };

  /**
   * Odeslání formuláře cíl ještě nezakládá — jen se zeptá.
   *
   * Rozfázování je nevratné a chvíli trvá, takže poslední krok má být
   * vědomý. Zkontroluje se, co jde zkontrolovat hned, a teprve pak se
   * ukáže otázka; chybu ve formuláři nemá smysl schovávat za dialog.
   */
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;

    const titleError = validateGoalTitle(title);
    if (titleError) return setError(titleError);

    const dateError = validateTargetDate(targetDate);
    if (dateError) return setError(dateError);

    setError(null);
    setConfirming(true);
  };

  const create = async () => {
    if (pending) return;

    setConfirming(false);
    setPending(true);

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          startingPoint: startingPoint.trim() || undefined,
          targetDate,
          importance,
          color,
          // Plán bude v jazyce, ve kterém uživatel aplikaci právě používá.
          locale,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(planErrorKey(data.error));
        setPending(false);
        return;
      }

      /**
       * Obrázky až teď, když je cíl na světě a má id.
       *
       * Postupně, ne najednou: každý se na serveru překóduje a paralelní
       * nahrání pěti fotek z telefonu by zbytečně zatížilo malý server.
       *
       * Selhání se schválně neřeší chybou. Cíl je založený, plán se
       * rozjíždí — shodit celé zakládání kvůli obrázku by bylo horší než
       * ten obrázek postrádat. Přidat se dá kdykoliv na detailu cíle.
       */
      for (const file of images) {
        const upload = new FormData();
        upload.append("file", file);
        try {
          await fetch(`/api/goals/${data.goalId}/images`, {
            method: "POST",
            body: upload,
          });
        } catch {
          // Viz komentář výš.
        }
      }

      // Cíl je založený, rozdělané zadání už není k čemu. Přes pojistku:
      // kdyby tu úložiště vyhodilo výjimku, spadlo by to do `catch` níž
      // a uživatel by viděl chybu u cíle, který se právě povedlo založit.
      clearGoalDraft();

      // Na detail cíle, kde se dopočítá zbytek rozfázování.
      router.push(`/${locale}/app/goals/${data.goalId}`);
    } catch {
      setError("generic");
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} onKeyDown={guardEnter} noValidate>
      {/* Krátký štítek do seznamů a do denního checklistu. */}
      <div>
        <label htmlFor="goal-title" className="block text-sm font-medium">
          {t("nameLabel")}
        </label>
        <input
          id="goal-title"
          aria-describedby="goal-title-hint"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={MAX_GOAL_TITLE}
          disabled={pending}
          placeholder={t("namePlaceholder")}
          className="mt-2.5 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] disabled:opacity-60"
        />
        <p
          id="goal-title-hint"
          className="mt-1.5 text-xs text-[var(--color-paper-faint)]"
        >
          {t("nameHint")}
        </p>
      </div>

      {/* Tohle je pole, ze kterého vzniká dobrý plán. Je proto hned za
          názvem a má víc místa než on. */}
      <div className="mt-6">
        <label htmlFor="goal-detail" className="block text-sm font-medium">
          {t("detailLabel")}
        </label>
        <textarea
          id="goal-detail"
          aria-describedby="goal-detail-hint"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          maxLength={MAX_GOAL_DETAIL}
          disabled={pending}
          placeholder={t("detailPlaceholder")}
          className="mt-2.5 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] leading-relaxed text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] disabled:opacity-60"
        />
        <p
          id="goal-detail-hint"
          className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]"
        >
          {t("detailHint")}
        </p>
      </div>

      {/* Výchozí bod je zvlášť schválně. Když byl jen zmínkou v dlouhém
          zástupném textu u podrobností, nikdo ho nevyplnil — a plán pak
          vypadal stejně pro začátečníka i pro pokročilého. */}
      <div className="mt-6">
        <label htmlFor="goal-start" className="block text-sm font-medium">
          {t("startLabel")}
        </label>
        <textarea
          id="goal-start"
          aria-describedby="goal-start-hint"
          value={startingPoint}
          onChange={(event) => setStartingPoint(event.target.value)}
          rows={3}
          maxLength={1000}
          disabled={pending}
          placeholder={t("startPlaceholder")}
          className="mt-2.5 w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] leading-relaxed text-[var(--color-paper)] placeholder:text-[var(--color-paper-faint)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] disabled:opacity-60"
        />
        <p
          id="goal-start-hint"
          className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]"
        >
          {t("startHint")}
        </p>
      </div>

      <div className="mt-6">
        <label htmlFor="goal-date" className="block text-sm font-medium">
          {t("dateLabel")}
        </label>
        <input
          id="goal-date"
          type="date"
          value={targetDate}
          min={minTargetDate()}
          max={maxTargetDate()}
          disabled={pending}
          onChange={(event) => setTargetDate(event.target.value)}
          className="mt-2.5 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[15px] text-[var(--color-paper)] transition focus:border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] disabled:opacity-60 sm:w-auto"
        />
      </div>

      {/* Důležitost řídí, jak velký díl denní kapacity cíl dostane, když
          jich běží víc. Slovní stupnice schválně — číslo od jedné do pěti
          si každý vyloží jinak. */}
      <fieldset className="mt-6">
        <legend className="block text-sm font-medium">
          {t("importanceLabel")}
        </legend>
        <p className="mt-1.5 text-xs text-[var(--color-paper-faint)]">
          {t("importanceHint")}
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {importanceLevels.map((level) => (
            <label
              key={level}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-[15px] transition ${
                importance === level
                  ? "border-[color-mix(in_oklab,var(--color-lime-glow)_50%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_7%,transparent)]"
                  : "border-white/10 hover:border-white/25"
              }`}
            >
              <input
                type="radio"
                name="importance"
                value={level}
                checked={importance === level}
                disabled={pending}
                onChange={() => setImportance(level)}
                className="h-4 w-4 accent-[var(--color-lime-soft)]"
              />
              <span>{t(`importance.${level}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Barva odliší úkoly tohohle cíle od ostatních v denním seznamu.
          U už rozebraných je vidět, který cíl je má — viz usedColors. */}
      <fieldset className="mt-6">
        <legend className="block text-sm font-medium">{t("colorLabel")}</legend>
        <p className="mt-1.5 text-xs text-[var(--color-paper-faint)]">
          {t("colorHint")}
        </p>

        <div className="mt-3 flex flex-wrap gap-2.5">
          {goalColors.map((option) => (
            <label
              key={option}
              title={
                usedColors[option]
                  ? `${t(`color.${option}`)} — ${t("colorTaken", { goal: usedColors[option] })}`
                  : t(`color.${option}`)
              }
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 transition ${
                color === option
                  ? "border-[var(--color-paper)]"
                  : "border-transparent hover:border-white/25"
              }`}
            >
              <input
                type="radio"
                name="color"
                value={option}
                checked={color === option}
                disabled={pending}
                onChange={() => setColor(option)}
                className="sr-only"
              />
              <span className="sr-only">
                {usedColors[option]
                  ? `${t(`color.${option}`)} — ${t("colorTaken", { goal: usedColors[option] })}`
                  : t(`color.${option}`)}
              </span>
              <span
                aria-hidden="true"
                className="relative h-6 w-6 rounded-full"
                style={{ backgroundColor: goalHex(option) }}
              >
                {usedColors[option] && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-[var(--color-ink-950)] bg-[var(--color-paper)]" />
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Dřív to byla jedna věta o šedesáti minutách, kterou každý
          přehlédl — a přitom se za ní schovávají tři nejsilnější vstupy
          do plánu. Teď je z toho karta, kde je všechny tři vidět naráz. */}
      <section className="mt-8 rounded-2xl border border-white/10 p-5">
        <h3 className="text-sm font-medium">{t("planningTitle")}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
          {t("planningHint")}
        </p>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-x-4">
            <dt className="text-[var(--color-paper-faint)]">
              {t("planningCapacity")}
            </dt>
            <dd className="text-[var(--color-paper)]">
              {t("minutesPerDay", { minutes: planning.dailyCapacityMinutes })}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-4">
            <dt className="text-[var(--color-paper-faint)]">
              {t("planningRest")}
            </dt>
            <dd className="text-[var(--color-paper)]">
              {tSettings(`rest.${planning.restFrequency}`)}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-4">
            <dt className="text-[var(--color-paper-faint)]">
              {t("planningReflection")}
            </dt>
            <dd className="text-[var(--color-paper)]">
              {planning.reflectionMinutesDay > 0
                ? t("minutesPerDay", { minutes: planning.reflectionMinutesDay })
                : tSettings("noReflection")}
            </dd>
          </div>
        </dl>

        {/* Rozepsaný cíl se drží v prohlížeči, takže odskok sem o nic
            nepřipraví — a odkaz si nese, odkud se má vrátit. */}
        <Link
          href={`/${locale}/app/settings?from=new-goal`}
          className="mt-4 inline-block rounded-full border border-white/15 px-4 py-1.5 text-sm font-medium transition hover:border-[color-mix(in_oklab,var(--color-lime-glow)_50%,transparent)]"
        >
          {t("planningChange")}
        </Link>

        <p className="mt-3 text-xs text-[var(--color-paper-faint)]">
          {t("planningKeepsDraft")}
        </p>
      </section>

      {/* Obrázky, které připomínají, proč to člověk dělá. Jeden z nich
          se pak ukazuje u denního seznamu. Spravovat jdou i potom na
          detailu cíle — tam se dají i odebírat. */}
      <fieldset className="mt-6">
        <legend className="block text-sm font-medium">
          {t("imagesLabel")}
        </legend>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
          {t("imagesHint")}
        </p>

        <input
          id="goal-images"
          type="file"
          accept="image/*"
          multiple
          disabled={pending}
          onChange={(event) =>
            setImages(Array.from(event.target.files ?? []))
          }
          className="sr-only"
        />
        <label
          htmlFor="goal-images"
          className={`mt-3 inline-block rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[var(--color-paper)] transition ${
            pending
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-white/30"
          }`}
        >
          {t("imagesChoose")}
        </label>

        {images.length > 0 && (
          <p className="mt-2 text-xs text-[var(--color-paper-faint)]">
            {t("imagesChosen", { count: images.length })}
          </p>
        )}
      </fieldset>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {tError(error)}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-7">
        {t("submit")}
      </button>

      {pending && <GenerationProgress namespace="plan.form.progress" />}

      {/* Zahození schválně až úplně dole a nenápadně. Je nevratné, takže
          sem nikdo nemá dojít omylem — ale kdo chce začít znovu, nemá
          mazat text po znacích. */}
      {!pending && (
        <p className="mt-10 border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={discard}
            className="text-sm text-[var(--color-paper-faint)] underline underline-offset-4 hover:text-[var(--color-paper-dim)]"
          >
            {t("discard")}
          </button>
        </p>
      )}

      {/*
        Poslední otázka před založením.

        Rozfázování je nevratné, trvá a stojí peníze — a dřív se spouštělo
        jediným klepnutím, které šlo trefit i omylem. Tady se člověk
        naposledy podívá, co má napsané, a rozhodne se vědomě.
      */}
      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="goal-confirm-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5"
        >
          <div className="card w-full max-w-md p-6">
            <h2 id="goal-confirm-title" className="display text-xl">
              {t("confirmTitle")}
            </h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
              {t("confirmBody")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={create}
                autoFocus
                className="btn-primary"
              >
                {t("confirmYes")}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-[var(--color-paper-dim)] transition hover:border-white/30 hover:text-[var(--color-paper)]"
              >
                {t("confirmBack")}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
