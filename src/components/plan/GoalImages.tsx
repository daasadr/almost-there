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
}: {
  goalId: string;
  images: GoalImageInfo[];
  maxImages: number;
}) {
  const t = useTranslations("plan.images");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

      <div className="mt-5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={full || uploading > 0}
          onChange={(event) => {
            if (event.target.files?.length) void upload(event.target.files);
          }}
          className="block w-full text-sm text-[var(--color-paper-dim)] file:mr-4 file:cursor-pointer file:rounded-full file:border file:border-white/15 file:bg-transparent file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--color-paper)] hover:file:border-white/30 disabled:opacity-50"
        />
        <p className="mt-2 text-xs text-[var(--color-paper-faint)]">
          {uploading > 0
            ? t("uploading", { count: uploading })
            : t("counter", { used: images.length, max: maxImages })}
        </p>
      </div>
    </section>
  );
}
