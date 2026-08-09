"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { goalHex } from "@/lib/plan/colors";
import type { TodayTask } from "@/lib/goals/queries";

/**
 * Denní checklist — to, kvůli čemu se aplikace otevírá.
 *
 * Odškrtnutí se projeví hned a teprve pak se posílá na server. Čekat na
 * odpověď u kliknutí, které uživatel udělá desetkrát denně, by bylo znát.
 * Když zápis selže, políčko se vrátí zpátky.
 */
export function TodayChecklist({
  tasks,
  daySeed,
  dailyImages,
}: {
  tasks: TodayTask[];
  /** Číslo dne — vybírá dnešní pochvalu. Viz `celebration()`. */
  daySeed: number;
  /** Dnešní obrázek pro každý cíl, který nějaký má. */
  dailyImages: Record<string, { id: string; alt: string | null }>;
}) {
  const t = useTranslations("plan.today");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(tasks.map((task) => [task.id, task.status])),
  );
  const [failed, setFailed] = useState(false);

  const toggle = async (task: TodayTask) => {
    const wasDone = statuses[task.id] === "DONE";
    const next = wasDone ? "PENDING" : "DONE";

    setStatuses((current) => ({ ...current, [task.id]: next }));
    setFailed(false);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error("write failed");

      // Ať sedí i souhrny na ostatních místech stránky.
      startTransition(() => router.refresh());
    } catch {
      setStatuses((current) => ({
        ...current,
        [task.id]: wasDone ? "DONE" : "PENDING",
      }));
      setFailed(true);
    }
  };

  const done = tasks.filter((task) => statuses[task.id] === "DONE").length;
  const byGoal = groupByGoal(tasks);
  const allDone = tasks.length > 0 && done === tasks.length;

  // Jedna hláška na den, ne náhoda při každém překreslení. Kdyby se měnila
  // pod rukama, bylo by okamžitě vidět, že je to ruleta, a přestala by
  // znamenat cokoliv.
  const celebrations = t.raw("celebrations") as string[];
  const celebration = celebrations[daySeed % celebrations.length];

  return (
    <div>
      <p className="text-sm text-[var(--color-paper-dim)]">
        {t("progress", { done, total: tasks.length })}
      </p>

      {allDone && (
        <p className="mt-4 rounded-2xl border border-[color-mix(in_oklab,var(--color-lime-glow)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-lime-glow)_8%,transparent)] px-5 py-4 text-[15px] text-[var(--color-lime-soft)]">
          {celebration}
        </p>
      )}

      {failed && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {t("preparingFailed")}
        </p>
      )}

      <div className="mt-5 space-y-7">
        {byGoal.map(([goalId, goalTasks]) => (
          <section key={goalId}>
            {byGoal.length > 1 && (
              <h3
                style={{ color: goalHex(goalTasks[0].goalColor) }}
                className="text-xs font-semibold uppercase tracking-wider"
              >
                {goalTasks[0].goalTitle}
              </h3>
            )}

            {/* Připomínka, proč to člověk dělá — dřív než seznam práce. */}
            {dailyImages[goalId] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/images/${dailyImages[goalId].id}`}
                alt={dailyImages[goalId].alt ?? ""}
                className="mt-3 max-h-56 w-full rounded-2xl object-cover"
              />
            )}

            <ul className="mt-3 space-y-2">
              {goalTasks.map((task) => {
                const checked = statuses[task.id] === "DONE";

                return (
                  <li key={task.id}>
                    <label
                      // Barva cíle drží úkol vizuálně u svého celku i tehdy,
                      // když se v seznamu míchají tři cíle za sebou.
                      style={{ borderLeftColor: goalHex(task.goalColor) }}
                      className={`flex cursor-pointer gap-3.5 rounded-xl border border-l-[3px] p-4 transition ${
                        checked
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(task)}
                        style={{ accentColor: goalHex(task.goalColor) }}
                        className="mt-0.5 h-5 w-5 shrink-0"
                      />

                      <span className="min-w-0">
                        <span
                          className={`block text-[15px] leading-snug ${
                            checked
                              ? "text-[var(--color-paper-faint)] line-through"
                              : "text-[var(--color-paper)]"
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.description && (
                          <span className="mt-1 block text-sm leading-relaxed text-[var(--color-paper-dim)]">
                            {task.description}
                          </span>
                        )}

                        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-paper-faint)]">
                          <span className={badgeClass(task.type)}>
                            {t(`type.${task.type}`)}
                          </span>
                          {task.estimatedMinutes && (
                            <span>
                              {t("minutes", { minutes: task.estimatedMinutes })}
                            </span>
                          )}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Odpočinek má vypadat jinak než práce — jinak splyne a přeskočí se. */
function badgeClass(type: string): string {
  const base = "rounded-full border px-2 py-0.5 font-medium";
  switch (type) {
    case "REST":
      return `${base} border-sky-300/25 text-sky-200/80`;
    case "REFLECTION":
      return `${base} border-amber-300/25 text-amber-200/80`;
    default:
      return `${base} border-white/15 text-[var(--color-paper-dim)]`;
  }
}

function groupByGoal(tasks: TodayTask[]): [string, TodayTask[]][] {
  const groups = new Map<string, TodayTask[]>();
  for (const task of tasks) {
    const list = groups.get(task.goalId);
    if (list) list.push(task);
    else groups.set(task.goalId, [task]);
  }
  return [...groups.entries()];
}
