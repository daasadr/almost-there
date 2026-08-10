-- Odkud uživatel začíná.
--
-- Vlastní sloupec, ne součást popisu: bez něj vypadá plán stejně pro
-- začátečníka i pro toho, kdo má půlku cesty za sebou — a lidi to sami
-- od sebe do zadání nenapíšou.
ALTER TABLE "Goal" ADD COLUMN "startingPoint" TEXT;
