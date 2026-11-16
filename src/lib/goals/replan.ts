import "server-only";
import { db } from "@/lib/db";
import { templateById } from "@/content/templates";
import { decomposeGoal, planUnit } from "@/lib/ai/decompose";
import { AiFormatError } from "@/lib/ai/call";
import { assertWithinBudget, recordUsage } from "@/lib/ai/usage";
import { addDays, parseIsoDate, toIsoDate, todayIso } from "@/lib/plan/calendar";
import { estimateNewTarget, getPaceStatus } from "./pace";
import { syncMilestones } from "./milestones";
import { catchUpDates, stretchRanges } from "./stretch";
import {
  acquireReplanLock,
  ReplanInProgressError,
  releaseReplanLock,
} from "./replan-lock";
import type { BlockLevel } from "@/generated/prisma";
import type { Locale } from "@/i18n/routing";

/**
 * Přeplánování cíle, který nabral skluz (zadání, bod 6 — adaptivní část).
 *
 * Dvě cesty: dohnat skluz ve stejném termínu, nebo posunout termín podle
 * tempa, kterým to reálně jde.
 *
 * ── Posun termínu obsah nepřepisuje ─────────────────────────────────
 *
 * Dlouho to tak bylo a byla to ta nejdražší chyba v celém produktu:
 * posun termínu smazal zbytek plánu a nechal model napsat nový. Člověk,
 * který si v polovině cesty nechal posunout termín, dostal cíl
 * rozplánovaný od začátku — „založit aplikaci, založit repozitář" —
 * a práci několika měsíců nikde.
 *
 * Termín se přitom posouvá právě proto, že obsah platí a jen potřebuje
 * víc času. Zbytek plánu se tedy roztáhne: období si nechají název,
 * milník i pořadí a dostanou jen nová data. Model se nevolá vůbec.
 * Viz `stretch.ts`.
 *
 * Přepisovat obsah má smysl jen tam, kde se obsah opravdu mění — tedy
 * u úpravy směru a u rozšíření cíle.
 *
 * ── Co s prací, která propadla ──────────────────────────────────────
 *
 * Rozhoduje uživatel, ne kód. Nechat ji být znamená, že zůstane
 * v minulosti jako záznam toho, co se nestihlo; vrátit ji znamená, že
 * se nedodělané úkoly rozloží po jednom na nejbližší dny.
 *
 * Dřív o tom rozhodoval kód a vždycky stejně — nepřenášet. Mělo to
 * dobrý důvod (kupka propadlých úkolů plán spolehlivě zabije), ale je
 * to rozhodnutí o cizí práci a jen její autor ví, jestli ještě dává
 * smysl. Při přepisu plánu modelem platí dál, že se jednotlivé úkoly
 * do promptu netahají.
 *
 * Do měsíčního limitu nových plánů se přeplánování nepočítá. Podmínky
 * slibují, že práce s už založeným cílem je bez omezení, a tohle je přesně
 * ona. Tichý strop v korunách platí dál.
 */

/**
 * Režimy přeplánování.
 *
 *  - moveDeadline — termín se posune podle tempa, jakým to reálně jde,
 *                   a zbytek plánu se do něj roztáhne beze změny obsahu.
 *  - adjust       — uživatel si přeje jinou cestu; termín zůstává.
 *  - extend       — cíl je u konce, ale ještě není dotažený tak, jak si
 *                   ho člověk představoval. Termín se posune na zadané
 *                   datum a zbytek plánu se dopíše podle toho, co ještě
 *                   chce dotáhnout.
 *
 * První se nabízí při skluzu, zbylé dva spouští uživatel sám.
 *
 * „Doženu skluz" tu schválně není. Dřív bývalo a znamenalo totéž co
 * moveDeadline, jen bez posunu termínu — tedy nový plán zhuštěný do
 * zbývajícího času. Jenže to dělalo něco jiného, než co ta volba
 * slibuje, takže se z ní stal `promiseCatchUp`: plán zůstává a jen se
 * pak kouká, jestli dluh zmizel. Model se u ní nevolá vůbec.
 */
export type ReplanMode = "moveDeadline" | "adjust" | "extend";

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
  extendTo,
  catchUpMissed = false,
}: {
  goalId: string;
  mode: ReplanMode;
  /** U režimů „adjust“ a „extend“: co si uživatel přeje. */
  steer?: string;
  /** Jen u režimu „extend“: nový termín, ISO datum. */
  extendTo?: string;
  /**
   * Vrátit nedodělané úkoly z minulosti na nejbližší dny?
   *
   * Volba uživatele z nabídky při posunu termínu. Výchozí je ne —
   * kdo se nerozhodl, tomu se do plánu nic nepřidává.
   */
  catchUpMissed?: boolean;
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
      templateId: true,
      // Odkdy se na cíli pracuje. Dává věk výchozímu bodu, který se
      // jinak čte, jako by platil dnes.
      createdAt: true,
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
  if (mode !== "adjust" && mode !== "extend") {
    const recent = await db.replanEvent.findFirst({
      where: {
        goalId,
        // Slib dohánění nic nepřeplánoval, takže nemá co blokovat.
        // Kdo se pokusil dohnat a za pár dní uzná, že to nejde, musí
        // smět posunout termín hned — ne čekat další den.
        reason: { notIn: ["USER_DECLINED_REPLAN", "USER_WILL_CATCH_UP"] },
        triggeredAt: { gte: new Date(Date.now() - COOLDOWN_HOURS * 3_600_000) },
      },
      select: { id: true },
    });
    if (recent) {
      throw new ReplanTooSoonError("Cíl byl přeplánován před chvílí.");
    }
  }

  /*
   * Rozpočet se hlídá jen tam, kde se opravdu volá model.
   *
   * Posun termínu je od téhle změny pouhý přepočet dat a nestojí nic.
   * Odmítnout ho kvůli vyčerpanému stropu by znamenalo nechat člověka
   * se skluzem bez jediné možnosti, jak se z něj dostat — a to zrovna
   * u volby, která je zadarmo.
   */
  if (mode !== "moveDeadline") {
    await assertWithinBudget(goal.userId);
  }

  /**
   * Odtud dál se do cíle nesmí sahat zvenčí.
   *
   * Následuje čtení tempa, několikaminutový hovor s modelem a nakonec
   * výměna celého plánu ode dneška dál. Odškrtnutí úkolu, které mezi tím
   * projde, se buď ztratí, nebo se rozejde s číslem, podle kterého model
   * psal zdůvodnění. Viz `replan-lock.ts`.
   */
  if (!(await acquireReplanLock(goalId))) {
    throw new ReplanInProgressError("Cíl se právě přeplánovává.");
  }

  try {
    const timezone = goal.user.timezone;
    const todayStr = todayIso(timezone);
    const today = parseIsoDate(todayStr);

    const pace = await getPaceStatus(goalId, timezone);
    const completionRate = pace?.completionRate ?? 1;
    const missedDays = pace?.missedDays ?? 0;

    /*
     * Nový termín.
     *
     * U „moveDeadline" se počítá z tempa, u „extend" ho zadal uživatel
     * sám — ví líp než my, kolik času na dotažení potřebuje. Jinde se
     * termín nemění.
     */
    const newTargetDate =
      mode === "moveDeadline"
        ? estimateNewTarget(today, goal.targetDate, completionRate)
        : mode === "extend" && extendTo
          ? parseIsoDate(extendTo)
          : goal.targetDate;

    // Bez budoucnosti není co plánovat. Viz DeadlinePassedError.
    if (newTargetDate.getTime() <= today.getTime()) {
      throw new DeadlinePassedError("Termín cíle už uplynul.");
    }

    /*
     * Posun termínu: roztáhnout, ne přepsat.
     *
     * Tohle je od téhle změny ta hlavní cesta a model se v ní nevolá.
     * Pod ní zůstává přepis modelem pro případ, že roztahovat není co —
     * tedy když je cíl ve svém posledním období a žádné další po něm
     * nepřijde. Tam se obsah opravdu dopsat musí.
     */
    if (mode === "moveDeadline") {
      const stretched = await stretchRemainingPlan({
        goalId,
        today,
        oldTarget: goal.targetDate,
        newTarget: newTargetDate,
      });

      if (stretched) {
        if (catchUpMissed) await carryMissedForward(goalId, today);

        await db.replanEvent.create({
          data: {
            goalId,
            reason: "BEHIND_SCHEDULE",
            // Obsah zůstal, změnila se jen data — stejně jako u návratu
            // z pozastavení, viz `pause.ts`.
            scope: "SCHEDULE_ONLY",
            oldTargetDate: goal.targetDate,
            newTargetDate,
            completionRate,
          },
        });

        // Milníky roztažených období už mají nová data; tohle dopíše
        // jen ty, které by snad chyběly.
        await syncMilestones(goalId);

        return { newTargetDate };
      }
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

    /**
     * Co je prokazatelně hotové.
     *
     * Tohle je rozdíl mezi plánem, který navazuje, a plánem, který začne
     * znovu od nuly. Model dosud viděl jen souhrny uplynulých období —
     * tedy co plán **chtěl** — a procento splnění. Z toho se nedá poznat,
     * že repozitář existuje, a tak ho po skluzu naplánoval podruhé.
     *
     * Čte se až tady, pod zámkem: mezi čtením a zápisem nového plánu se
     * plnění měnit nemůže, takže seznam nemůže zestárnout.
     *
     * Odpočinkové úkoly se nepočítají — odškrtnutý odpočinek není důkaz
     * o práci a v seznamu by vytlačil něco, co jím je.
     */
    const [achievedMilestones, recentlyDoneTasks] = await Promise.all([
      db.milestone.findMany({
        where: { goalId, achievedAt: { not: null } },
        orderBy: { targetDate: "asc" },
        // Název milníku bývá jen štítek („Základy"). Co se tím doopravdy
        // umí, stojí v souhrnu období — a právě to má model vědět.
        select: { title: true, timeBlock: { select: { summary: true } } },
      }),
      db.task.findMany({
        where: { goalId, status: "DONE", completedAt: { not: null }, type: { not: "REST" } },
        orderBy: { completedAt: "desc" },
        take: 12,
        select: { title: true },
      }),
    ]);

    // Odsud dál se volá model, takže teď na strop v korunách.
    await assertWithinBudget(goal.userId);

    const { plan, usage, ranges } = await decomposeGoal({
      goal: goal.title,
      // Šablona platí i při přeplánování. Bez toho by plán po prvním
      // skluzu ztratil všechno, čím se lišil od obecného rozvrhu —
      // a uživatel by nepoznal proč.
      guidance: goal.templateId
        ? templateById(goal.templateId)?.guidance
        : undefined,
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
        startedOn: toIsoDate(goal.createdAt),
        pastMilestones: pastBlocks.map((block) => block.summary),
        achieved: achievedMilestones.map(
          (milestone) => milestone.timeBlock?.summary ?? milestone.title,
        ),
        recentlyDone: recentlyDoneTasks.map((task) => task.title),
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
      /*
       * Milníky zkrácených etap odcházejí s nimi.
       *
       * Etapa, kterou dnešek teprve procházel, se nemaže, jen zkrátí
       * ke včerejšku — kvůli historii odškrtávání. Její milník ale
       * zůstával viset s původním datem, které je po zkrácení v
       * minulosti, takže aplikace hned hlásila „jsi u milníku".
       *
       * Po rozšíření cíle to bylo vidět nejhůř: milník vyskočil po
       * prvním splněném úkolu nové řady, tedy po jediném dni práce.
       *
       * Dosažené milníky zůstávají. Ty už jsou zážitek, ne položka
       * rozvrhu, a nový plán je nemá co brát.
       */
      const truncated = await tx.timeBlock.findMany({
        where: { goalId, endDate: { gte: today } },
        select: { id: true },
      });

      if (truncated.length) {
        await tx.milestone.deleteMany({
          where: {
            goalId,
            achievedAt: null,
            timeBlockId: { in: truncated.map((block) => block.id) },
          },
        });
      }

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
          // Když model zkoušku nevrátí, zůstane ta původní. Přepsat ji
          // na prázdno by znamenalo, že člověk po přeplánování přestane
          // vědět, k čemu míří — a to je horší než zkouška z minula.
          ...(plan.finalChallenge
            ? { finalChallenge: plan.finalChallenge }
            : {}),
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
          reason:
          mode === "adjust" || mode === "extend"
            ? "MANUAL"
            : "BEHIND_SCHEDULE",
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

    // Volba uživatele platí i tady. Propadlé úkoly visí na blocích
    // z minulosti, které přepis nemaže, takže se jim dá dát nový den
    // stejně jako po roztažení.
    if (catchUpMissed) await carryMissedForward(goalId, today);

    // Nová období, nové milníky. Dosažené zůstávají — jsou to zážitky,
    // ne položky rozvrhu.
    await syncMilestones(goalId);

    return { newTargetDate };
  } finally {
    // I spadlé přeplánování musí cíl odemknout, jinak si uživatel
    // už nikdy nic neodškrtne.
    await releaseReplanLock(goalId);
  }
}

/**
 * Roztažení zbytku plánu do pozdějšího termínu.
 *
 * Běžící období se nehýbe: jsou v něm rozepsané dny, odškrtnuté úkoly
 * a dnešek, na který se člověk dívá. Kotvou je proto den po jeho konci
 * — odtud dál se období roztáhnou v poměru, o kolik se posunul termín.
 *
 * Vrátí `false`, když roztahovat není co: cíl je ve svém posledním
 * období a žádné další po něm nepřijde. Tam se obsah musí dopsat a volá
 * se model.
 */
async function stretchRemainingPlan({
  goalId,
  today,
  oldTarget,
  newTarget,
}: {
  goalId: string;
  today: Date;
  oldTarget: Date;
  newTarget: Date;
}): Promise<boolean> {
  const blocks = await db.timeBlock.findMany({
    where: { goalId, parentBlockId: null },
    orderBy: { startDate: "asc" },
    select: { id: true, startDate: true, endDate: true },
  });

  const current = blocks.filter((block) => block.startDate <= today).at(-1);
  const future = blocks.filter((block) => block.startDate > today);

  if (future.length === 0) return false;

  const anchor = current ? addDays(current.endDate, 1) : today;

  /*
   * Pojistky proti plánu s dírou na konci.
   *
   * Roztažení drží jedno: poslední období končí novým termínem. Kdyby
   * se termín neposouval dopředu nebo kdyby za kotvou nebyl žádný
   * prostor, nemá se co roztáhnout — a kdyby se přesto zapsal nový
   * termín, vznikl by za posledním obdobím kus času bez úkolů, na
   * kterém se plán tiše zastaví. V takovém případě radši dopíše model.
   */
  if (
    newTarget.getTime() <= oldTarget.getTime() ||
    anchor.getTime() >= oldTarget.getTime()
  ) {
    return false;
  }
  const ranges = stretchRanges({ blocks: future, anchor, oldTarget, newTarget });

  await db.$transaction([
    /*
     * Rozepsané týdny a dny budoucích období odcházejí.
     *
     * Za normálních okolností žádné nejsou — nižší úrovně se dopisují
     * až ve chvíli, kdy na ně dojde. Kdyby přece jen byly, nesedělo by
     * jim datum a plán by měl uvnitř období kus rozvrhu mimo něj.
     * Kaskáda vezme s bloky i jejich úkoly.
     */
    db.timeBlock.deleteMany({
      where: { goalId, parentBlockId: { in: future.map((block) => block.id) } },
    }),

    ...ranges.map((range, index) =>
      db.timeBlock.update({
        where: { id: future[index].id },
        data: { startDate: range.startDate, endDate: range.endDate },
      }),
    ),

    // Milník patří svému období a jde s ním. Dosažené se nehýbou —
    // datum, kdy se něco povedlo, se posouvat nedá.
    ...ranges.map((range, index) =>
      db.milestone.updateMany({
        where: { goalId, timeBlockId: future[index].id, achievedAt: null },
        data: { targetDate: range.endDate },
      }),
    ),

    db.goal.update({
      where: { id: goalId },
      data: { targetDate: newTarget },
    }),
  ]);

  return true;
}

/**
 * Vrácení propadlé práce na nejbližší dny.
 *
 * Jen na výslovné přání uživatele. Po jednom úkolu na den, od nejstaršího
 * — dvě dodělávky denně by vedle skutečného plánu postavily druhý a
 * nejspíš by se nestihlo ani jedno.
 *
 * Mění se jen den, na který úkol patří, ne jeho obsah. Zaplatit zkoušku
 * pořád musíš, jen ne tehdy; je to tentýž úkol v jiný den — stejně jako
 * u ručního odložení.
 */
async function carryMissedForward(goalId: string, today: Date): Promise<number> {
  const missed = await db.task.findMany({
    where: {
      goalId,
      status: "PENDING",
      // Odpočinek se nedohání a odložené „nevím kdy" si uživatel
      // odložil sám — do těch se nesahá.
      type: { not: "REST" },
      OR: [
        { deferredTo: { lt: today } },
        {
          deferredTo: null,
          timeBlock: { level: "DAY", startDate: { lt: today } },
        },
      ],
    },
    orderBy: [{ timeBlock: { startDate: "asc" } }, { position: "asc" }],
    select: { id: true },
  });

  if (missed.length === 0) return 0;

  // Dny, na kterých už odpočinek stojí v plánu. Rozepsaný bývá jen
  // nejbližší týden, takže jich je pár — ale právě na ty by dodělávka
  // dopadla nejhůř.
  const restDays = await db.timeBlock.findMany({
    where: {
      goalId,
      level: "DAY",
      startDate: { gte: today },
      tasks: { some: { type: "REST" } },
    },
    select: { startDate: true },
  });

  const dates = catchUpDates({
    count: missed.length,
    // Od zítřka: dnešek už člověk zčásti prožil a jeho plán zná.
    from: addDays(today, 1),
    restDates: new Set(restDays.map((block) => toIsoDate(block.startDate))),
  });

  await db.$transaction(
    missed.map((task, index) =>
      db.task.update({
        where: { id: task.id },
        data: { deferredTo: dates[index] },
      }),
    ),
  );

  return missed.length;
}

/** Uživatel nabídku odmítl. Zapíšeme to, ať se neptáme hned zítra znovu. */
export async function declineReplan(goalId: string): Promise<void> {
  await db.replanEvent.create({
    data: { goalId, reason: "USER_DECLINED_REPLAN", scope: "NONE" },
  });
}

/**
 * „Doženu skluz“ — slib, že si uživatel zbytek dodělá sám.
 *
 * Plán se **nemění**. Dlouho to bylo naopak: tahle volba smazala zbytek
 * plánu a nechala model napsat nový, zhuštěný do zbývajícího času. Bylo
 * to drahé, trvalo to minuty a hlavně to dělalo něco jiného, než co
 * tlačítko slibuje. Kdo říká „doženu to“, nechce nový plán — chce
 * dodělat, co zůstalo, a aby se mu pod rukama nic nehýbalo.
 *
 * Nedodělané úkoly z posledního týdne má na přehledu a může je odškrtat.
 * Tím mizí i ze statistiky vynechaných dnů, takže „dohnal jsem to“ se
 * nemusí nikam hlásit — pozná se to samo.
 *
 * Zapisuje se jen proto, aby se pár dní mlčelo a pak se dalo zjistit,
 * jestli dluh opravdu zmizel. Viz `getPaceStatus`.
 */
export async function promiseCatchUp(goalId: string): Promise<void> {
  await db.replanEvent.create({
    data: { goalId, reason: "USER_WILL_CATCH_UP", scope: "NONE" },
  });
}
