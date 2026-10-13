-- Index na vazbu milníku k bloku plánu.
--
-- Vazba je SetNull, takže při smazání každého bloku musí databáze najít
-- milníky, které na něj ukazují. Bez indexu to znamená projít celou
-- tabulku — a smazání cíle maže stovky bloků, přeplánování desítky.
-- Tedy stovky průchodů na jednu akci, a každé další přeplánování
-- pomalejší, jak tabulka roste.
CREATE INDEX "Milestone_timeBlockId_idx" ON "Milestone"("timeBlockId");
