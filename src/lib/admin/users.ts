import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import type { Prisma } from "@/generated/prisma";

/**
 * Čtení uživatelů pro správu.
 *
 * Záměrně tu není nic z obsahu cílů — jen počty. Provozovatel potřebuje
 * vědět, kolik lidí platí a kdo kolik protočil, ne co si kdo předsevzal.
 * Cíle bývají osobní a v zásadách zpracování slibujeme, že k nim je
 * přístup omezený; kdyby je správa vypisovala, přestalo by to platit.
 */

export const USERS_PER_PAGE = 25;

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  authProvider: string;
  isEmailVerified: boolean;
  subscriptionStatus: string;
  subscriptionSource: string | null;
  subscriptionEndsAt: Date | null;
  subscriptionNote: string | null;
  createdAt: Date;
  goalCount: number;
  /** Spotřeba AI v tomto kalendářním měsíci, v korunách. */
  monthlySpendCzk: number;
  /** Kolik nových plánů z měsíčního limitu už padlo. */
  plansUsed: number;
};

export type AdminUsersPage = {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageCount: number;
  /** Souhrn za celou databázi, ne jen za zobrazenou stránku. */
  totals: {
    all: number;
    paying: number;
    complimentary: number;
  };
};

function startOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function listUsers({
  query = "",
  page = 1,
}: {
  query?: string;
  page?: number;
}): Promise<AdminUsersPage> {
  const trimmed = query.trim();
  const where: Prisma.UserWhereInput = trimmed
    ? {
        OR: [
          { email: { contains: trimmed, mode: "insensitive" } },
          { name: { contains: trimmed, mode: "insensitive" } },
        ],
      }
    : {};

  const total = await db.user.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / USERS_PER_PAGE));
  const current = Math.min(Math.max(1, page), pageCount);

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (current - 1) * USERS_PER_PAGE,
    take: USERS_PER_PAGE,
    select: {
      id: true,
      email: true,
      name: true,
      authProvider: true,
      emailVerified: true,
      subscriptionStatus: true,
      subscriptionSource: true,
      subscriptionEndsAt: true,
      subscriptionNote: true,
      createdAt: true,
      _count: { select: { goals: true } },
    },
  });

  // Spotřeba se dotahuje jedním dotazem pro celou stránku, ne po uživateli.
  const ids = users.map((user) => user.id);
  const since = startOfMonth();

  const spend = ids.length
    ? await db.aiUsageEvent.groupBy({
        by: ["userId"],
        where: { userId: { in: ids }, createdAt: { gte: since } },
        _sum: { costHellers: true },
      })
    : [];

  const plans = ids.length
    ? await db.aiUsageEvent.groupBy({
        by: ["userId"],
        where: {
          userId: { in: ids },
          operation: "DECOMPOSE_GOAL",
          createdAt: { gte: since },
        },
        _count: { _all: true },
      })
    : [];

  const spendById = new Map(
    spend.map((row) => [row.userId, row._sum.costHellers ?? 0]),
  );
  const plansById = new Map(plans.map((row) => [row.userId, row._count._all]));

  const [paying, complimentary] = await Promise.all([
    db.user.count({
      where: {
        subscriptionStatus: { in: ["ACTIVE", "TRIAL"] },
        subscriptionSource: { not: "COMPLIMENTARY" },
      },
    }),
    db.user.count({ where: { subscriptionSource: "COMPLIMENTARY" } }),
  ]);

  return {
    rows: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      authProvider: user.authProvider,
      isEmailVerified: Boolean(user.emailVerified),
      subscriptionStatus: user.subscriptionStatus,
      subscriptionSource: user.subscriptionSource,
      subscriptionEndsAt: user.subscriptionEndsAt,
      subscriptionNote: user.subscriptionNote,
      createdAt: user.createdAt,
      goalCount: user._count.goals,
      monthlySpendCzk: (spendById.get(user.id) ?? 0) / 100,
      plansUsed: plansById.get(user.id) ?? 0,
    })),
    total,
    page: current,
    pageCount,
    totals: {
      all: await db.user.count(),
      paying,
      complimentary,
    },
  };
}

/** Kolik bezplatných účtů si můžeš dovolit podle vlastního pravidla. */
export function complimentaryBudget(payingCount: number): number {
  return Math.floor(payingCount / env.complimentaryPerPayingUsers);
}
