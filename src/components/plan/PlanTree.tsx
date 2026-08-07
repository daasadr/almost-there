import { getTranslations } from "next-intl/server";
import type { PlanNode } from "@/lib/goals/queries";

/**
 * Hierarchie plánu: období → kratší úseky → dny s úkoly.
 *
 * Rozbalené je jen to, co má rozpad. Zbytek zůstává jako jeden řádek —
 * plán na deset let jinak nejde přečíst.
 */
export async function PlanTree({
  nodes,
  locale,
  depth = 0,
}: {
  nodes: PlanNode[];
  locale: string;
  depth?: number;
}) {
  const t = await getTranslations({ locale, namespace: "plan.detail" });
  const tToday = await getTranslations({ locale, namespace: "plan.today" });

  const range = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });
  const dayLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <ol className={depth === 0 ? "space-y-3" : "mt-4 space-y-3"}>
      {nodes.map((node) => {
        const isDay = node.level === "DAY";

        return (
          <li
            key={node.id}
            className={
              depth === 0
                ? "card p-5 sm:p-6"
                : "rounded-xl border border-white/10 p-4"
            }
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3
                className={
                  depth === 0
                    ? "display text-lg"
                    : "text-[15px] font-semibold text-[var(--color-paper)]"
                }
              >
                {isDay
                  ? dayLabel.format(node.startDate)
                  : (node.title ?? t(`level.${node.level}`))}
              </h3>

              {!isDay && (
                <span className="text-xs tabular-nums text-[var(--color-paper-faint)]">
                  {range.format(node.startDate)} – {range.format(node.endDate)}
                </span>
              )}
            </div>

            <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-paper-dim)]">
              {node.summary}
            </p>

            {node.tasks.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {node.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                  >
                    <span
                      className={
                        task.status === "DONE"
                          ? "text-[var(--color-paper-faint)] line-through"
                          : "text-[var(--color-paper-dim)]"
                      }
                    >
                      {task.title}
                    </span>
                    <span className="text-xs text-[var(--color-paper-faint)]">
                      {tToday(`type.${task.type}`)}
                      {task.estimatedMinutes
                        ? ` · ${tToday("minutes", { minutes: task.estimatedMinutes })}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {node.children.length > 0 && (
              <PlanTree
                nodes={node.children}
                locale={locale}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
