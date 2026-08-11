-- Odložení úkolu na jindy.
--
-- Plán vzniká jednou a nemůže vědět o věcech mimo něj — že zrovna nejsou
-- peníze, že se instruktor rozstonal, že prší. Bez odložení zbývají dvě
-- špatné cesty: odškrtnout nesplněné, nebo nechat úkol propadnout.
-- To první je horší, protože podle odškrtaných dní se počítá tempo.
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'DEFERRED';

ALTER TABLE "Task" ADD COLUMN "deferredTo" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "deferReason" TEXT;

-- Podle tohohle se hledají úkoly přesunuté na konkrétní den.
CREATE INDEX "Task_deferredTo_idx" ON "Task"("deferredTo");
