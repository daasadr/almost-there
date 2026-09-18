import "server-only";
import { db } from "@/lib/db";
import { decomposeGoal, planUnit } from "@/lib/ai/decompose";
import { AiFormatError } from "@/lib/ai/call";
import { assertWithinBudget, recordUsage } from "@/lib/ai/usage";
import { parseIsoDate, toIsoDate, todayIso } from "@/lib/plan/calendar";
import { estimateNewTarget, getPaceStatus } from "./pace";
import { syncMilestones } from "./milestones";
import type { BlockLevel } from "@/generated/prisma";
import type { Locale } from "@/i18n/routing";

/**
 * Přeplánování cíle, který nabral skluz (zadání, bod 6 — adaptivní část).
 *
 * Dvě cesty: dohnat skluz ve stejném termínu, nebo posunout termín podle
 * tempa, kterým to reálně jde. V obou případech se zbytek plánu vytvoří
 * znovu od dneška.
 *
 * Nedodělané úkoly se nepřenášejí. Zůstanou v minulosti jako záznam toho,
 * co se nestihlo, a nový plán z nich vezme jen to, co ještě dává smysl —
 * viz instrukce v promptu. Přesouvat propadlé úkoly dopředu je nejrychlejší
 * způsob, jak z plánu udělat kupku, kterou nikdo neotevře.
 *
 * Do měsíčního limitu nových plánů se přeplánování nepočítá. Podmínky
 * slibují, že práce s už založeným cílem je bez omezení, a tohle je přesně
 * ona. Tichý strop v korunách platí dál.
 */

/**
 * Režimy přeplánování.
 *
 *  - catchUp      — termín zůstává, zbytek se zhustí, ať se to stihne.
 *  - moveDeadline — termín se posune podle tempa, jakým to reálně jde.
 *  - adjust       — uživatel si přeje jinou cestu; termín zůstává.
 *
 * První dva se nabízejí při skluzu, ten třetí spouští uživatel sám.
 */
export type ReplanMode = "catchUp" | "moveDeadline" | "adjust";

export class ReplanTooSoonError extends Error {
  readonly name = "ReplanTooSoonError";
}

/**
 * „Doženu skluz“ u cíle, jehož termín už uplynul.
 *
 * Dohnat skluz znamená nechat termín být a zbytek do něj natlačit. Když
 * je ale termín za námi, není do čeho tlačit: rozsah od dneška k němu
 * vyjde prázdný, model dostane zadání na nula období a celé to spadne.
 *
 * Uživatel pak viděl „nepovedlo se, zkus to znovu“ a zkoušel to dokola,
 * protože z té hlášky nešlo poznat, že to nemůže vyjít nikdy. Tohle je
 * to samé zjištění, jen o minutu dřív a srozumitelně — a bez volání
 * modelu, které bylo odsouzené předem.
 */
export class DeadlinePassedError extends Error {
  readonly name = "DeadlinePassedError";
}

/** Jak dlouho po přeplánování další nepovolit. */
const COOLDOWN_HOURS = 24;

const REST_WORDS: Record<string, string> = {
  NONE: "no fixed rest days",
  ONE_DAY_PER_WEEK: "one full rest day per week",
  TWO_DAYS_PER_WEEK: "two full rest days per week",
  EVERY_OTHER_DAY: "every other day is a rest day",
};

function asLocale(value: string): Locale {
  return (value === "cs" || value === "de" ? value : "en") as Locale;
}

export async function replanGoal({
  goalId,
  mode,
  steer,
}: {
  goalId: string;
  mode: ReplanMode;
  /** Jen u režimu „adjust“: co si uživatel přeje dělat jinak. */
  steer?: string;
}): Promise<{ newTargetDate: Date }> {
  const goal = await db.goal.findUniqueOrThrow({
    where: { id: goalId },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      startingPoint: true,
      targetDate: true,
      locale: true,
      restatement: true,
      user: {
        select: {
          timezone: true,
          dailyCapacityMinutes: true,
          restFrequency: true,
          reflectionMinutesDay: true,
        },
      },
    },
  });

  /**
   * Odstup mezi přeplánováními — ale jen u těch, která nabízí aplikace.
   *
   * Strop tu je proto, aby se nabídka „dohnat, nebo posunout termín“
   * nespouštěla pořád dokola. Na úpravu směru ale nesedí: posunout
   * termín a změnit obsah jsou dvě různá rozhodnutí a jedno nemá blokovat
   * druhé. Kdo si zrovna nechal spočítat nový termín a pak si uvědomí,
   * že chce jinou cestu, by musel čekat den — a to je na vlastní vědomé
   * rozhodnutí nesmysl.
   *
   * Náklady hlídá `assertWithinBudget` níž, ne tenhle strop.
   */
  if (mode !== "adjust") {
    const recent = await db.replanEvent.findFirst({
      where: {
        goalId,
        reason: { not: "USER_DECLINED_REPLAN" },
        triggeredAt: { gte: new Date(Date.now() - COOLDOWN_HOURS * 3_600_000) },
      },
      select: { id: true },
    });
    if (recent) {
      throw new ReplanTooSoonError("Cíl byl přeplánován před chvílí.");
    }
  }

  await assertWithinBudget(goal.userId);

  const timezone = goal.user.timezone;
  const todayStr = todayIso(timezone);
  const today = parseIsoDate(todayStr);

  const pace = await getPaceStatus(goalId, timezone);
  const completionRate = pace?.completionRate ?? 1;
  const missedDays = pace?.missedDays ?? 0;

  const newTargetDate =
    mode === "moveDeadline"
      ? estimateNewTarget(today, goal.targetDate, completionRate)
      : goal.targetDate;

  // Bez budoucnosti není co plánovat. Viz DeadlinePassedError.
  if (newTargetDate.getTime() <= today.getTime()) {
    throw new DeadlinePassedError("Termín cíle už uplynul.");
  }

  // Milníky období, která už začala — vstup pro model, ať ví, odkud
  // navazuje. Patří sem i období právě běžící: jeho první část je taky
  // za námi a částečně splněná.
  const pastBlocks = await db.timeBlock.findMany({
    where: { goalId, parentBlockId: null, startDate: { lt: today } },
    orderBy: { startDate: "asc" },
    select: { summary: true },
  });

  /**
   * A období, která teprve přijdou.
   *
   * Právě tahle část plánu se za chvíli smaže a nahradí novou — a dokud
   * ji model neviděl, stavěl zbytek cesty od nuly jen z názvu cíle.
   * Rozmyšlené kroky tím mizely a po každém přeplánování vycházel trochu
   * jiný plán. U úpravy směru je to nejcitelnější: mění se jediná věc,
   * takže zbytek nemá důvod se hýbat.
   *
   * Je to jen souhrn období nejvyšší úrovně, ne celý strom — na
   * navázání to stačí a týdny s dny se stejně počítají znovu.
   */
  const upcomingBlocks = await db.timeBlock.findMany({
    where: { goalId, parentBlockId: null, endDate: { gte: today } },
    orderBy: { startDate: "asc" },
    select: { summary: true },
  });

  /**
   * Proč něco nešlo — vlastními slovy uživatele, z odložených úkolů.
   *
   * Tohle je jediné místo, kde se plán dozví o překážkách stojících mimo
   * něj: že nejsou peníze na zkoušku, že se čeká na někoho jiného. Bez
   * nich by nový plán narazil na tutéž zeď podruhé.
   *
   * Bere se posledních pár a jen ty vyplněné — políčko je nepovinné
   * a delší seznam by v promptu jen ředil to podstatné.
   */
  const deferred = await db.task.findMany({
    where: { goalId, deferReason: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { deferReason: true },
  });
  const blockers = deferred
    .map((task) => task.deferReason?.trim())
    .filter((reason): reason is string => Boolean(reason));

  const { plan, usage, ranges } = await decomposeGoal({
    goal: goal.title,
    // Bez těchhle dvou by přeplánovaný cíl vyšel obecnější než původní.
    context: goal.description ?? undefined,
    startingPoint: goal.startingPoint ?? undefined,
    targetDate: toIsoDate(newTargetDate),
    locale: asLocale(goal.locale),
    today: todayStr,
    dailyCapacityMinutes: goal.user.dailyCapacityMinutes,
    restFrequency: REST_WORDS[goal.user.restFrequency],
    reflectionMinutesPerDay: goal.user.reflectionMinutesDay,
    replan: {
      pastMilestones: pastBlocks.map((block) => block.summary),
      upcomingMilestones: upcomingBlocks.map((block) => block.summary),
      completionRate,
      missedDays,
      deadlineMoved: mode === "moveDeadline",
      blockers,
      steer,
    },
  }).catch(async (error) => {
    if (error instanceof AiFormatError && error.usage) {
      await recordUsage({
        userId: goal.userId,
        operation: "REPLAN",
        usage: error.usage,
        label: `přeplánování ${goal.id} — NEÚSPĚCH`,
      });
    }
    throw error;
  });

  await recordUsage({
    userId: goal.userId,
    operation: "REPLAN",
    usage,
    label: `přeplánování ${mode} období=${plan.periods.length}`,
  });

  const level = planUnit(plan.level) as BlockLevel;

  const yesterday = new Date(today.getTime() - 86_400_000);

  await db.$transaction(async (tx) => {
    // Odejde všechno od dneška dál, na kterékoliv úrovni. Kaskáda ve
    // schématu vezme s bloky i jejich úkoly.
    await tx.timeBlock.deleteMany({
      where: { goalId, startDate: { gte: today } },
    });

    // Období, které dneškem teprve prochází, se nemaže, jen zkrátí ke
    // včerejšku. Kdyby zmizelo celé, přišli bychom s ním o odškrtané dny
    // z jeho první poloviny — a právě podle nich se počítá, jak rychle
    // to člověku jde. Bez té historie by příští vyhodnocení tempa začínalo
    // od nuly a vyšlo by nesmyslně optimisticky.
    await tx.timeBlock.updateMany({
      where: { goalId, endDate: { gte: today } },
      data: { endDate: yesterday },
    });

    await tx.goal.update({
      where: { id: goalId },
      data: {
        targetDate: newTargetDate,
        restatement: plan.goalRestated,
        assumptions: plan.assumptions,
        feasibility: plan.feasibility,
        feasibilityNote: plan.feasibilityNote,
        timeBlocks: {
          create: plan.periods.map((period, i) => ({
            level,
            startDate: ranges[i].startDate,
            endDate: ranges[i].endDate,
            title: period.title,
            summary: period.milestone,
            position: i + 1,
          })),
        },
      },
    });

    await tx.replanEvent.create({
      data: {
        goalId,
        // Úprava směru není skluz. Je to vlastní rozhodnutí uživatele
        // a v historii cíle se má číst jinak než „nestíhal“.
        reason: mode === "adjust" ? "MANUAL" : "BEHIND_SCHEDULE",
        // SCHEDULE_ONLY = termín zůstává, mění se rozvržení.
        // FULL_REDECOMPOSITION = posunul se i termín.
        scope:
          mode === "moveDeadline" ? "FULL_REDECOMPOSITION" : "SCHEDULE_ONLY",
        oldTargetDate: goal.targetDate,
        newTargetDate,
        completionRate,
        aiSummary: plan.feasibilityNote,
      },
    });
  });

  // Nová období, nové milníky. Dosažené zůstávají — jsou to zážitky,
  // ne položky rozvrhu.
  await syncMilestones(goalId);

  return { newTargetDate };
}

/** Uživatel nabídku odmítl. Zapíšeme to, ať se neptáme hned zítra znovu. */
export async function declineReplan(goalId: string): Promise<void> {
  await db.replanEvent.create({
    data: { goalId, reason: "USER_DECLINED_REPLAN", scope: "NONE" },
  });
}
