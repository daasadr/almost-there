-- Zámek na dobu přeplánování cíle.
--
-- Přeplánování trvá minuty a na konci přepíše plán ode dneška dál. Bez
-- zámku mohl uživatel mezitím odškrtávat úkoly, které pak zmizely spolu
-- s dnešním blokem — a zdůvodnění od modelu zůstalo stát na číslech
-- z doby před jeho odškrtáváním.
--
-- Prázdné u cíle, na kterém nic neběží. Opuštěný zámek se po deseti
-- minutách přebíjí, aby pád procesu nezablokoval odškrtávání natrvalo.
ALTER TABLE "Goal" ADD COLUMN "replanningAt" TIMESTAMP(3);
