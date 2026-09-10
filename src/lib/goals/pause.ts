import "server-only";
import { db } from "@/lib/db";

/**
 * Pozastavení cíle a návrat z něj.
 *
 * Pozastavit cíl šlo odjakživa: přestane dávat denní úkoly, neubírá
 * z denní kapacity ostatním a nepočítá se do pětice běžících. Návrat ale
 * řešený nebyl — a to je problém, který roste s délkou pauzy.
 *
 * Kdo si cíl odložil na dva měsíce, našel po obnovení plán celý
 * v minulosti: týdny, které měly proběhnout v červenci, termín, který
 * mezitím uplynul, a dnešek bez jediného úkolu. Aplikace pak tvrdila,
 * že je člověk o dva měsíce pozadu, přestože se prostě jen domluvili,
 * že se to odloží.
 *
 * Zbytek plánu se proto při návratu posune o tu samou dobu, jakou cíl
 * stál. Nic se negeneruje znovu: rozvržení, které kdysi vzniklo ze
 * zadání, zůstává i s pořadím a rozestupy — jen dostane dnešní data.
 * Je to levné, okamžité a hlavně předvídatelné, což se o novém volání
 * modelu říct nedá.
 *
 * Minulost se nepřepisuje. Bloky, které začaly před pozastavením,
 * zůstávají tam, kde byly — proběhly, ať dopadly jakkoliv, a historie
 * plnění je to jediné, z čeho jde tempo vyčíst.
 */

export async function pauseGoal(goalId: string): Promise<void> {
  await db.goal.update({
    where: { id: goalId },
    data: { status: "PAUSED", pausedAt: new Date() },
  });
}

export async function resumeGoal(goalId: string): Promise<void> {
  const goal = await db.goal.findUniqueOrThrow({
    where: { id: goalId },
    select: { id: true, pausedAt: true, targetDate: true },
  });

  const pausedAt = goal.pausedAt;

  // Bez data pozastavení není podle čeho posouvat. Stane se to u cílů
  // pozastavených dřív, než tenhle údaj vůbec existoval.
  const shiftDays = pausedAt
    ? Math.floor((Date.now() - pausedAt.getTime()) / 86_400_000)
    : 0;

  if (!pausedAt || shiftDays < 1) {
    await db.goal.update({
      where: { id: goal.id },
      data: { status: "ACTIVE", pausedAt: null },
    });
    return;
  }

  const newTarget = new Date(goal.targetDate.getTime() + shiftDays * 86_400_000);

  await db.$transaction([
    /*
     * Posun se dělá v databázi, ne načtením a uložením zpátky.
     *
     * Roční cíl má stovky denních bloků a protahovat je všechny přes
     * aplikaci by znamenalo stovky dotazů kvůli změně jednoho čísla.
     */
    db.$executeRaw`
      UPDATE "TimeBlock"
      SET "startDate" = "startDate" + (${shiftDays}::int * INTERVAL '1 day'),
          "endDate"   = "endDate"   + (${shiftDays}::int * INTERVAL '1 day')
      WHERE "goalId" = ${goal.id} AND "startDate" >= ${pausedAt}
    `,

    // Odložené úkoly mají vlastní datum, které na blocích nezávisí.
    db.$executeRaw`
      UPDATE "Task"
      SET "deferredTo" = "deferredTo" + (${shiftDays}::int * INTERVAL '1 day')
      WHERE "goalId" = ${goal.id} AND "deferredTo" >= ${pausedAt}
    `,

    // Dosažené milníky zůstávají, kde jsou — jsou to zážitky, ne položky
    // rozvrhu, a datum, kdy se něco povedlo, se posouvat nesmí.
    db.$executeRaw`
      UPDATE "Milestone"
      SET "targetDate" = "targetDate" + (${shiftDays}::int * INTERVAL '1 day')
      WHERE "goalId" = ${goal.id}
        AND "achievedAt" IS NULL
        AND "targetDate" >= ${pausedAt}
    `,

    db.goal.update({
      where: { id: goal.id },
      data: { status: "ACTIVE", pausedAt: null, targetDate: newTarget },
    }),

    /*
     * Záznam o posunu, a ne jen kvůli historii.
     *
     * Vyhodnocení tempa počítá vynechané dny od posledního přeplánování.
     * Bez tohohle záznamu by se celá pauza počítala jako dny, kdy se nic
     * nedělo, a aplikace by hned po návratu nabídla „dohnat, nebo posunout
     * termín“ — u cíle, jehož termín právě posunula sama.
     */
    db.replanEvent.create({
      data: {
        goalId: goal.id,
        reason: "MANUAL",
        scope: "SCHEDULE_ONLY",
        oldTargetDate: goal.targetDate,
        newTargetDate: newTarget,
      },
    }),
  ]);
}
