"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Track } from "@/content/music";

/**
 * Přehrávač motivační hudby.
 *
 * Jeden zvuk na celou stránku, ne jeden na skladbu. Kdyby měla každá
 * položka vlastní přehrávač, dalo by se spustit pět písniček přes sebe
 * — a dřív nebo později by to někdo udělal.
 *
 * Vlastní ovládání místo `controls` od prohlížeče proto, že výchozí
 * přehrávač vypadá v každém prohlížeči jinak a v žádném jako zbytek
 * aplikace. Posuvník je obyčejný `range`, takže umí klávesnici
 * a čtečku obrazovky bez naší práce.
 *
 * Nic se nepředstahuje dopředu (`preload="none"`): seznam skladeb by
 * jinak při otevření stránky stáhl desítky megabajtů, i kdyby si
 * člověk nepustil nic.
 */

function time(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function MusicPlayer({ tracks }: { tracks: Track[] }) {
  const t = useTranslations("extras.music");

  const audio = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [length, setLength] = useState(0);

  const play = (index: number) => {
    const element = audio.current;
    if (!element) return;

    if (index === current) {
      if (playing) {
        element.pause();
      } else {
        void element.play();
      }
      return;
    }

    setCurrent(index);
    setAt(0);
    setLength(0);
    element.src = `/music/${tracks[index].file}`;
    void element.play();
  };

  const seek = (value: number) => {
    const element = audio.current;
    if (!element) return;
    element.currentTime = value;
    setAt(value);
  };

  return (
    <div>
      <audio
        ref={audio}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setAt(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setLength(event.currentTarget.duration)}
        // Na konci se pustí další. Seznam, který po každé skladbě
        // ztichne, nutí člověka vracet se k počítači.
        onEnded={() => {
          const next = current === null ? null : current + 1;
          if (next !== null && next < tracks.length) play(next);
          else setPlaying(false);
        }}
      />

      <ul className="space-y-2">
        {tracks.map((track, index) => {
          const active = index === current;

          return (
            <li key={track.file}>
              <div
                className={`card flex items-center gap-4 p-4 transition ${
                  active ? "border-l-[3px] border-l-[var(--color-lime-soft)]" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => play(index)}
                  aria-label={
                    active && playing ? t("pause") : t("play", { title: track.title })
                  }
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-edge transition hover:border-edge-hover"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5 fill-[var(--color-lime-soft)]"
                  >
                    {active && playing ? (
                      <>
                        <rect x="7" y="5" width="4" height="14" rx="1" />
                        <rect x="13" y="5" width="4" height="14" rx="1" />
                      </>
                    ) : (
                      <path d="M8 5.5v13l11-6.5z" />
                    )}
                  </svg>
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-base text-[var(--color-paper)]">
                    {track.title}
                  </p>
                  {track.note && (
                    <p className="mt-0.5 text-sm text-[var(--color-paper-dim)]">
                      {track.note}
                    </p>
                  )}

                  {/* Posuvník se ukáže jen u hrající skladby. U všech
                      naráz by to byl plot a nedalo by se poznat, co hraje. */}
                  {active && (
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={length || 0}
                        value={at}
                        step={1}
                        onChange={(event) => seek(Number(event.target.value))}
                        aria-label={t("position")}
                        className="h-1 flex-1 cursor-pointer accent-[var(--color-lime-soft)]"
                      />
                      <span className="shrink-0 text-xs tabular-nums text-[var(--color-paper-faint)]">
                        {time(at)} / {time(length)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
