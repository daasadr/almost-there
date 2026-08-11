"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { goalHex } from "@/lib/plan/colors";

/**
 * Úkoly odložené stranou bez data.
 *
 * Odložený a zapomenutý úkol je totéž co smazaný, jen bez rozhodnutí.
 * Proto tenhle seznam: leží mimo denní plán, nic nepřipomíná a nikoho
 * netlačí, ale je vidět. Jediné, co se v něm dá udělat, je dát úkolu
 * datum — a tím ho vrátit zpátky do života.
 */

type DeferredTask = {
  id: string;
  title: string;
  goalTitle: string;
  goalColor: string;
};

function todayIsoLocal(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function DeferredTasks({ tasks }: { tasks: DeferredTask[] }) {
  const t = useTranslations("plan.deferred");
  const router = useRouter();

  const [openId, setOpenId] = useState<string | null>(null);
  const [date, setDate] = useState(todayIsoLocal);
  const [pending, setPending] = useState(false);

  if (tasks.length === 0) return null;

  const schedule = async (taskId: string) => {
    setPending(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/defer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (response.ok) {
        setOpenId(null);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-[var(--color-paper)]">
        {t("title", { count: tasks.length })}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-paper-faint)]">
        {t("body")}
      </p>

      <ul className="mt-4 space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            style={{ borderLeftColor: goalHex(task.goalColor) }}
            className="rounded-xl border border-l-[3px] border-white/10 p-3.5"
          >
            <p className="text-[15px] leading-snug text-[var(--color-paper)]">
              {task.title}
            </p>
            <p className="mt-1 text-xs text-[var(--color-paper-faint)]">
              {task.goalTitle}
            </p>

            {openId === task.id ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={date}
                  min={todayIsoLocal()}
                  disabled={pending}
                  onChange={(event) => setDate(event.target.value)}
                  className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-[var(--color-paper)] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={pending || !date}
                  onClick={() => void schedule(task.id)}
                  className="rounded-full border border-[color-mix(in_oklab,var(--color-lime-glow)_45%,transparent)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-lime-soft)] transition hover:bg-[color-mix(in_oklab,var(--color-lime-glow)_8%,transparent)] disabled:opacity-50"
                >
                  {t("confirm")}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  disabled={pending}
                  className="text-xs text-[var(--color-paper-faint)] underline-offset-4 hover:underline"
                >
                  {t("cancel")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpenId(task.id)}
                className="mt-2.5 text-xs text-[var(--color-lime-soft)] underline-offset-4 hover:underline"
              >
                {t("schedule")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
