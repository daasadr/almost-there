-- Závěrečná zkouška a závěrečná odměna.
--
-- Konec cíle byl do teď tichý: plán došel, úkoly se odškrtaly a nic
-- neřeklo, čím se to prokáže ani co si za to člověk dopřeje. Milníky
-- přitom odměny mají — chybělo to právě u toho největšího.
ALTER TABLE "Goal" ADD COLUMN "finalChallenge" TEXT;
ALTER TABLE "Goal" ADD COLUMN "finalRewardText" TEXT;
ALTER TABLE "Goal" ADD COLUMN "finalRewardSource" "RewardSource";
ALTER TABLE "Goal" ADD COLUMN "finalRewardClaimed" BOOLEAN NOT NULL DEFAULT false;
