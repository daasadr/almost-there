-- Hlášení od uživatelů: co nefunguje nebo zlobí.
--
-- Text je šifrovaný aplikací (viz lib/crypto/prisma-extension.ts), takže
-- ve sloupci stojí šifra, ne čitelná věta. Proto na něj nejde index ani
-- fulltext — hledá se podle data a stavu.
--
-- Vazba je Cascade schválně: zásady slibují, že výmaz účtu znamená
-- smazání dat doslova, a volný text od uživatele je osobní údaj.

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'DONE');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "path" TEXT,
    "locale" TEXT NOT NULL,
    "storeApp" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
