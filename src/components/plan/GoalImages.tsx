"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export type GoalImageInfo = {
  id: string;
  width: number;
  height: number;
  alt: string | null;
};

/**
 * Motivační obrázky u cíle.
 *
 * Nahrané soubory se zmenší a překódují na serveru, takže sem stačí poslat
 * originál. U velkých fotek z telefonu to chvíli trvá — proto stav nahrávání.
 */
export function GoalImages({
  goalId,
  images,
  maxImages,
  imagesBelowTasks,
}: {
  goalId: string;
  images: GoalImageInfo[];
  maxImages: number;
  /** Uživatelova předvolba, kam obrázky na dnešku patří. */
  imagesBelowTasks: boolean;
}) {
  const t = useTranslations("plan.images");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Přepnutí se ukazuje hned; kdyby se čekalo na server, tlačítko by po
  // klepnutí chvíli tvrdilo, že se nic nestalo.
  const [position, setPositionState] = useState(imagesBelowTasks);
  const [savingPosition, setSavingPosition] = useState(false);
  const [positionFailed, setPositionFailed] = useState(false);

  const setPosition = async (below: boolean) => {
    if (below === position) return;

    setPositionState(below);
    setPositionFailed(false);
    setSavingPosition(true);

    try {
      const response = await fetch("/api/account/display", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagesBelowTasks: below }),
      });
      if (!response.ok) throw new Error("write failed");
      router.refresh();
    } catch {
      // Zpátky na to, co platí doopravdy — přepínač nesmí tvrdit něco
      // jiného než databáze.
      setPositionState(!below);
      setPositionFailed(true);
    } finally {
      setSavingPosition(false);
    }
  };

  const full = images.length >= maxImages;

  const upload = async (files: FileList) => {
    setError(null);

    // Postupně, ne najednou: každý soubor se na serveru překódovává a paralelní
    // nahrání pěti fotek z mobilu by zbytečně zatížilo malý server.
    const queue = [...files].slice(0, maxImages - images.length);
    setUploading(queue.length);

    for (const file of queue) {
      const body = new FormData();
      body.append("file", file);

      try {
        const response = await fetch(`/api/goals/${goalId}/images`, {
          method: "POST",
          body,
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(
            typeof data.error === "string" &&
              ["tooManyImages", "imageTooLarge", "imageUnreadable"].includes(
                data.error,
              )
              ? data.error
              : "uploadFailed",
          );
          break;
        }
      } catch {
        setError("uploadFailed");
        break;
      } finally {
        setUploading((count) => count - 1);
      }
    }

    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  };

  const remove = async (imageId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("delete failed");
      router.refresh();
    } catch {
      setError("uploadFailed");
    }
  };

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="display text-lg">{t("title")}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      {images.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <li key={image.id} className="group relative">
              {/* Vlastní <img>: soubory jdou přes chráněný endpoint, který
                  optimalizátor Next.js stejně obejít nedokáže. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/images/${image.id}`}
                alt={image.alt ?? ""}
                width={image.width}
                height={image.height}
                loading="lazy"
                className="aspect-square w-full rounded-xl bg-white/[0.03] object-contain"
              />
              <button
                type="button"
                onClick={() => remove(image.id)}
                aria-label={t("remove")}
                className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              >
                {t("remove")}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {t(`errors.${error}`)}
        </p>
      )}

      {/*
        Vlastní tlačítko místo systémového pole pro soubor.

        Prohlížeč vedle něj sám dopisuje „Soubor nevybrán“ a nechává to
        tam i ve chvíli, kdy je nahraných pět obrázků — protože se to
        netýká nahraných souborů, ale toho, co je zrovna v poli. Uživatel
        to čte jako chybu a hledá, co udělal špatně.

        Pole tu zůstává skryté a klikání za něj obstará popisek; jinak by
        se přišlo o výběr souborů, který systém umí sám.
      */}
      <div className="mt-5">
        <input
          ref={inputRef}
          id={`images-${goalId}`}
          type="file"
          accept="image/*"
          multiple
          disabled={full || uploading > 0}
          onChange={(event) => {
            if (event.target.files?.length) void upload(event.target.files);
          }}
          className="sr-only"
        />
        <label
          htmlFor={`images-${goalId}`}
          aria-disabled={full || uploading > 0}
          className={`inline-block rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-[var(--color-paper)] transition ${
            full || uploading > 0
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-white/30"
          }`}
        >
          {t("choose")}
        </label>
        <p className="mt-2 text-xs text-[var(--color-paper-faint)]">
          {uploading > 0
            ? t("uploading", { count: uploading })
            : t("counter", { used: images.length, max: maxImages })}
        </p>
      </div>

      {/*
        Kam obrázek na dnešku patří.

        Předvolba je uživatelova, ne cíle — nastavuje se tady, protože
        tady na obrázky člověk myslí, ale platí všude. Kdyby ji měl každý
        cíl vlastní, vypadal by denní seznam u tří cílů pokaždé jinak.

        Ukazuje se, i když zatím žádný obrázek nahraný není: kdo si první
        fotku právě vybral, řeší tuhle otázku hned vzápětí.
      */}
      <div className="mt-7 border-t border-white/5 pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-paper-faint)]">
          {t("positionTitle")}
        </h3>

        <div
          role="group"
          aria-label={t("positionTitle")}
          className="mt-3 flex flex-wrap gap-2"
        >
          {[false, true].map((below) => {
            const selected = position === below;
            return (
              <button
                key={String(below)}
                type="button"
                onClick={() => void setPosition(below)}
                disabled={savingPosition}
                aria-pressed={selected}
                className={`rounded-full border px-4 py-2 text-sm transition disabled:opacity-50 ${
                  selected
                    ? "border-[color-mix(in_oklab,var(--color-lime-glow)_55%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_10%,transparent)] font-medium text-[var(--color-lime-soft)]"
                    : "border-white/15 text-[var(--color-paper-dim)] hover:border-white/30 hover:text-[var(--color-paper)]"
                }`}
              >
                {below ? t("positionBelow") : t("positionAbove")}
              </button>
            );
          })}
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-[var(--color-paper-faint)]">
          {positionFailed ? t("positionFailed") : t("positionHint")}
        </p>
      </div>
    </section>
  );
}
