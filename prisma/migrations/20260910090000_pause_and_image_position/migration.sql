-- Dlouhodobé pozastavení cíle a poloha motivačních obrázků.
--
-- Pozastavení existovalo, ale návrat z něj ne. Kdo si cíl odložil na
-- dva měsíce, našel po obnovení plán celý v minulosti i s termínem,
-- který mezitím uplynul. Datum pozastavení je to jediné, co k posunutí
-- zbytku plánu chybělo.
ALTER TABLE "Goal" ADD COLUMN "pausedAt" TIMESTAMP(3);

-- Obrázky nad úkoly, nebo pod nimi. Nahoře je obrázek první, co člověk
-- ráno uvidí, ale odsune tím úkoly pod okraj obrazovky. Rozhodnutí,
-- co je důležitější, patří uživateli.
ALTER TABLE "User" ADD COLUMN "imagesBelowTasks" BOOLEAN NOT NULL DEFAULT false;
