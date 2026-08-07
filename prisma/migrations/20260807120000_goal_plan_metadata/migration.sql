-- Roční úroveň rozpadu pro dlouhé cíle.
-- Postgres 12+ zvládne přidání hodnoty do enumu i uvnitř transakce,
-- dokud se ta hodnota ve stejné transakci nepoužije. Tady se nepoužívá.
ALTER TYPE "BlockLevel" ADD VALUE 'YEAR' BEFORE 'MONTH';

-- Co k plánu řekla AI. Nullable, protože cíle založené dřív to nemají.
ALTER TABLE "Goal" ADD COLUMN     "restatement" TEXT,
                   ADD COLUMN     "assumptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
                   ADD COLUMN     "feasibility" TEXT,
                   ADD COLUMN     "feasibilityNote" TEXT;

-- Krátký štítek bloku do přehledu. Doteď měl blok jen `summary`, což je
-- celá věta a jako nadpis se nehodí.
ALTER TABLE "TimeBlock" ADD COLUMN "title" TEXT;
