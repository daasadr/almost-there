"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { goalHex } from "@/lib/plan/colors";

/**
 * Odměny získané dnes, které si uživatel ještě nedopřál.
 *
 * Když se milník potvrdí, zmizí ze seznamu i s textem odměny — a s ním
 * i to jediné, co člověku připomíná, že si má něco dopřát. Odměnu si
 * málokdo vezme hned ráno; přečte si ji, řekne si „až večer" a do večera
 * na ni zapomene.
 *
 * Proto zůstane na dnešku viset, dokud si ji neodškrtne — nebo dokud den
 * neskončí. Zítra je pryč: připomínka, která se opakuje donekonečna,
 * přestane být oslavou a stane se dalším nesplněným úkolem.
 */

type EarnedReward = {
  id: string;
  title: string;
  rewardText: string;
  goalTitle: string;
  goalColor: string;
};

export function EarnedRewards({ rewards }: { rewards: EarnedReward[] }) {
  const t = useTranslations("plan.earnedRewards");
  const router = useRouter();

  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);

  const remaining = rewards.filter((reward) => !claimed.has(reward.id));
  if (remaining.length === 0) return null;

  const claim = async (id: string) => {
    setPending(id);
    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimed: true }),
      });
      if (response.ok) {
        // Zmizí hned, ať odškrtnutí něco udělá. Načtení stránky to
        // potvrdí, ale čekat na něj by působilo, že se nic nestalo.
        setClaimed((current) => new Set(current).add(id));
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[color-mix(in_oklab,var(--color-lime-glow)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_8%,transparent)] p-5 sm:p-6">
      <h2 className="display text-lg text-[var(--color-lime-soft)]">
        {t("title", { count: remaining.length })}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-dim)]">
        {t("body")}
      </p>

      <ul className="mt-5 space-y-3">
        {remaining.map((reward) => (
          <li
            key={reward.id}
            style={{ borderLeftColor: goalHex(reward.goalColor) }}
            className="rounded-xl border border-l-[3px] border-white/10 bg-black/20 p-4"
          >
            <p className="text-[15px] leading-relaxed text-[var(--color-paper)]">
              {reward.rewardText}
            </p>
            <p className="mt-1.5 text-xs text-[var(--color-paper-faint)]">
              {reward.title} · {reward.goalTitle}
            </p>

            <button
              type="button"
              disabled={pending === reward.id}
              onClick={() => void claim(reward.id)}
              className="mt-3 rounded-full border border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] px-4 py-1.5 text-sm font-medium text-[var(--color-lime-soft)] transition hover:bg-[color-mix(in_oklab,var(--color-lime-glow)_10%,transparent)] disabled:opacity-50"
            >
              {t("claim")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
