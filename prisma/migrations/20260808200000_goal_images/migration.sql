-- Motivační obrázky u cíle. Soubor leží na disku, tady je jen odkaz.
CREATE TABLE "GoalImage" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoalImage_storageKey_key" ON "GoalImage"("storageKey");
CREATE INDEX "GoalImage_goalId_idx" ON "GoalImage"("goalId");

-- Se smazaným cílem odejdou i záznamy o jeho obrázcích. Soubory z disku
-- maže aplikace zvlášť — databáze na ně nedosáhne.
ALTER TABLE "GoalImage" ADD CONSTRAINT "GoalImage_goalId_fkey"
    FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
