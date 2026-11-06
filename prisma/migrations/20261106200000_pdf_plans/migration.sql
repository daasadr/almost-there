-- Jednorázově zakoupené plány v PDF.
--
-- Vlastní tabulka, ne příznak u cíle: na Goal.status = ACTIVE se ptá
-- denní přehled, oznámení i vyhodnocení tempa, a „cíl, který se
-- neodškrtává" by se do nich musel všude dopisovat.
--
-- title, description a planJson šifruje aplikace (viz
-- lib/crypto/prisma-extension.ts), takže v nich stojí šifra. Proto na
-- ně nejde index ani hledání. Plán je uložený jako text, ne jako json,
-- právě kvůli tomu — sloupec typu json by šifrováním neprošel.

-- CreateEnum
CREATE TYPE "PdfPlanStatus" AS ENUM ('AWAITING_PAYMENT', 'PAID', 'GENERATING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "PdfPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startingPoint" TEXT,
    "templateId" TEXT,
    "weeks" INTEGER NOT NULL,
    "hoursPerWeek" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "PdfPlanStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "planJson" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'czk',
    "stripeSessionId" TEXT,
    "consentedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3),
    "goalId" TEXT,

    CONSTRAINT "PdfPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PdfPlan_stripeSessionId_key" ON "PdfPlan"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PdfPlan_goalId_key" ON "PdfPlan"("goalId");

-- CreateIndex
CREATE INDEX "PdfPlan_userId_createdAt_idx" ON "PdfPlan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PdfPlan_status_idx" ON "PdfPlan"("status");

-- AddForeignKey
ALTER TABLE "PdfPlan" ADD CONSTRAINT "PdfPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
