import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  isComplete,
  parsePlan,
  type Granularity,
} from "@/lib/pdf-plans/plan";
import { renderPlanPdf, type RenderStrings } from "@/lib/pdf-plans/render";
import { templateById } from "@/content/pdf-plans";
import type { Locale } from "@/i18n/routing";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Stažení zakoupeného plánu.
 *
 * Sází se při každém stažení znovu, soubor se neukládá. Je to pod
 * vteřinu a odpadá tím celá otázka, kam ho uložit, jak ho zálohovat
 * a co s ním při smazání účtu. Plán se po vygenerování nemění, takže
 * opakované stažení dá vždycky totéž.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;

  // Vlastnictví je součástí dotazu, ne kontrolou po něm. Cizí
  // objednávka tak vypadá stejně jako neexistující.
  const order = await db.pdfPlan.findFirst({
    where: { id, userId: session.user.id },
    select: {
      title: true,
      locale: true,
      weeks: true,
      planJson: true,
      templateId: true,
      startDate: true,
      targetDate: true,
      createdAt: true,
    },
  });
  if (!order) return NextResponse.json({ ok: false }, { status: 404 });

  const plan = parsePlan(order.planJson);
  if (!plan || !isComplete(plan)) {
    return NextResponse.json({ ok: false, error: "notReady" }, { status: 409 });
  }

  const locale = order.locale as Locale;
  const template = order.templateId ? templateById(order.templateId) : undefined;

  const strings = await buildStrings({
    locale,
    weeks: order.weeks,
    granularity: plan.granularity,
    startDate: order.startDate,
    targetDate: order.targetDate,
    createdAt: order.createdAt,
    // Co se škrtá při skluzu je ze šablony, ne od modelu: je to
    // nejcennější věta v dokumentu a nemá kolísat od objednávky
    // k objednávce. U vlastního cíle se použije obecná.
    whenBehind: template?.text[locale].whenBehind,
    disclaimer: template?.disclaimer,
  });

  const pdf = await renderPlanPdf({ title: order.title, plan, strings });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      /*
       * `inline`, ne `attachment`: na mobilu se PDF otevře rovnou
       * v prohlížeči a stáhnout se dá odtamtud. Vynucené stažení
       * u telefonu často skončí souborem, který uživatel nenajde.
       */
      "Content-Disposition": `inline; filename="${fileName(order.title)}"`,
      // Soukromý obsah: nesmí se usadit v žádné sdílené mezipaměti.
      "Cache-Control": "private, no-store",
    },
  });
}

/**
 * Název souboru bez diakritiky a bez mezer.
 *
 * Hlavička `Content-Disposition` nese jen ASCII a některé prohlížeče
 * si s českými znaky neporadí — stažený soubor by se jmenoval jako
 * změť. Čitelnost je tu důležitější než přesnost názvu.
 */
function fileName(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .toLowerCase();

  return `${base || "plan"}.pdf`;
}

async function buildStrings({
  locale,
  weeks,
  granularity,
  startDate,
  targetDate,
  createdAt,
  whenBehind,
  disclaimer,
}: {
  locale: Locale;
  weeks: number;
  granularity: Granularity;
  startDate: Date;
  targetDate: Date;
  createdAt: Date;
  whenBehind?: string;
  disclaimer?: "health" | "finance";
}): Promise<RenderStrings> {
  const t = await getTranslations({ locale, namespace: "pdfPlans.doc" });

  const longDate = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  const dayFormat = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "numeric",
  });
  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
  });

  // Poledne v UTC: v žádném pásmu, ve kterém aplikace běží, to
  // nepřeteče do sousedního dne.
  const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

  const span = (startIso: string, endIso: string) =>
    `${dateFormat.format(at(startIso))} – ${dateFormat.format(at(endIso))}`;

  return {
    subtitle: t("subtitle", { weeks }),
    coverEyebrow: t("coverEyebrow"),
    coverStart: t("coverStart", { date: longDate.format(startDate) }),
    coverTarget: t("coverTarget", { date: longDate.format(targetDate) }),
    coverMade: t("coverMade", { date: longDate.format(createdAt) }),
    overviewTitle: t("overview"),
    behindTitle: t("behindTitle"),
    behindText: whenBehind ?? t("behindGeneric"),
    closingTitle: t("closingTitle"),
    closingBody: t("closingBody"),
    disclaimer:
      disclaimer === "health"
        ? t("disclaimerHealth")
        : disclaimer === "finance"
          ? t("disclaimerFinance")
          : undefined,
    assumptionsLabel: t("assumptions"),
    challengeLabel: t("challenge"),
    /*
     * U podrobného plánu je období týden, u týdenního měsíc. Nadpis
     * se tím musí řídit, jinak by v ročním plánu svatby stálo
     * „Týden 7" nad čtyřmi týdny.
     */
    periodLabel: (index) =>
      granularity === "weekly" ? t("month", { index }) : t("week", { index }),
    minutes: (value) => t("minutes", { value }),
    /*
     * Oddíl je den, nebo týden. U dne se píše název dne v týdnu,
     * protože podle něj se v rozpisu hledá; u týdne rozsah dat.
     */
    slotHeading: (startIso, endIso) =>
      granularity === "weekly"
        ? span(startIso, endIso)
        : dayFormat.format(at(startIso)),
    periodRange: (startIso, endIso) => span(startIso, endIso),
    page: (current, total) => t("page", { current, total }),
  };
}
