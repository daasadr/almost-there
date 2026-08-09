-- Vypovězené předplatné, které ještě běží do konce zaplaceného období.
-- Bez toho by aplikace nedokázala říct, do kdy přístup platí.
ALTER TABLE "User" ADD COLUMN "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

-- Dotažení cíle. Datum kvůli tomu, aby šlo spočítat, jak dlouho to trvalo;
-- shrnutí se ukládá proto, aby bylo pokaždé stejné — vzpomínka, která se
-- při každém otevření mění, není vzpomínka.
ALTER TABLE "Goal" ADD COLUMN     "completedAt" TIMESTAMP(3),
                   ADD COLUMN     "completionNote" TEXT;

-- Vlastní operace pro závěrečné shrnutí, ať jde spotřeba rozlišit.
ALTER TYPE "AiOperation" ADD VALUE 'GOAL_COMPLETED';
