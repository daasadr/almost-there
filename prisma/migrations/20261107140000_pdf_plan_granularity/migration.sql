-- Podrobnost plánu a volné dny.
--
-- Ne každý cíl se vyplatí rozepisovat na dny. U maturity ano, u svatby
-- ne — tam je otázka „co zařídit tenhle týden" a rozpis po dnech by
-- předstíral přesnost, kterou nikdo nedodrží.
--
-- Volné dny volí uživatel, protože volno není u každého o víkendu.
-- Prázdné pole znamená, že se plánuje každý den.

ALTER TABLE "PdfPlan" ADD COLUMN "granularity" TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE "PdfPlan" ADD COLUMN "restDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
