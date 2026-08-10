-- Co má uživatel rád a co mu nic neříká.
--
-- Vstupuje do návrhů odměn za milníky. Bez toho model hádá z ničeho
-- a vychází z toho průměr — dlouhá koupel a večer s knihou pro každého.
-- Odměna, kterou si člověk nepřeje, nemotivuje.
--
-- Obsah se ukládá zašifrovaný, stejně jako názvy cílů.
ALTER TABLE "User" ADD COLUMN "rewardLikes" TEXT;
ALTER TABLE "User" ADD COLUMN "rewardDislikes" TEXT;
