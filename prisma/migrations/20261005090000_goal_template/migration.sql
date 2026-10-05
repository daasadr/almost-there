-- Ze které šablony cíl vznikl.
--
-- Šablona nese odborný pokyn pro model. Bez tohohle sloupce by se pokyn
-- použil jen při založení a po prvním přeplánování by z plánu zmizelo
-- všechno, čím se lišil od obecného rozvrhu.
ALTER TABLE "Goal" ADD COLUMN "templateId" TEXT;
